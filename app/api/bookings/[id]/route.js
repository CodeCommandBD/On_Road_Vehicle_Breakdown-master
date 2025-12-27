import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import Garage from "@/lib/db/models/Garage";
import Review from "@/lib/db/models/Review";
import Notification from "@/lib/db/models/Notification";
import PointsRecord from "@/lib/db/models/PointsRecord";
import User from "@/lib/db/models/User";
import Payment from "@/lib/db/models/Payment";
import JobCard from "@/lib/db/models/JobCard";
import { requireAuth } from "@/lib/utils/auth";
import { validateStatusTransition } from "@/lib/utils/bookingHelpers";
import {
  handleError,
  NotFoundError,
  ForbiddenError,
} from "@/lib/utils/errorHandler";
import { successResponse } from "@/lib/utils/apiResponse";
import { MESSAGES } from "@/lib/utils/constants";

/**
 * GET /api/bookings/[id]
 * Get single booking details
 */
export async function GET(request, { params }) {
  try {
    await connectDB();

    // Require authentication
    const currentUser = await requireAuth(request);
    const { id } = await params;

    const booking = await Booking.findById(id)
      .populate("garage", "name rating address images logo owner")
      .populate("user", "name email phone avatar")
      .populate({
        path: "assignedMechanic",
        select: "name phone avatar",
        strictPopulate: false,
      })
      .populate({
        path: "jobCard",
        strictPopulate: false,
      });

    // Fetch review separately if exists
    const review = await Review.findOne({ booking: id });
    // Fetch latest payment info
    const payment = await Payment.findOne({ bookingId: id }).sort({
      createdAt: -1,
    });

    if (!booking) {
      throw new NotFoundError(MESSAGES.ERROR.BOOKING_NOT_FOUND);
    }

    // Authorization check
    let isAuthorized = false;

    if (currentUser.role === "admin") {
      isAuthorized = true;
    } else if (booking.user._id.toString() === currentUser.userId) {
      isAuthorized = true;
    } else if (
      booking.garage &&
      booking.garage.owner &&
      booking.garage.owner.toString() === currentUser.userId
    ) {
      isAuthorized = true;
    } else if (
      currentUser.role === "mechanic" &&
      booking.assignedMechanic?._id?.toString() === currentUser.userId
    ) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      throw new ForbiddenError(MESSAGES.ERROR.FORBIDDEN);
    }

    return successResponse(
      {
        booking: {
          ...booking.toObject(),
          review: review,
          paymentInfo: payment,
        },
      },
      "বুকিং বিস্তারিত সফলভাবে পাওয়া গেছে"
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/bookings/[id]
 * Update booking status and details
 */
export async function PATCH(request, { params }) {
  try {
    await connectDB();

    // Require authentication
    const currentUser = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      actualCost,
      notes,
      billItems,
      towingRequested,
      towingCost,
      assignedMechanic,
    } = body;

    const booking = await Booking.findById(id).populate("garage", "owner");
    if (!booking) {
      throw new NotFoundError(MESSAGES.ERROR.BOOKING_NOT_FOUND);
    }

    // Authorization check
    let isAuthorized = false;

    if (currentUser.role === "admin") {
      isAuthorized = true;
    } else if (
      currentUser.role === "garage" &&
      booking.garage?.owner?.toString() === currentUser.userId
    ) {
      isAuthorized = true;
    } else if (
      currentUser.role === "mechanic" &&
      booking.assignedMechanic?.toString() === currentUser.userId
    ) {
      isAuthorized = true;
    } else if (
      currentUser.role === "user" &&
      booking.user?.toString() === currentUser.userId
    ) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      throw new ForbiddenError(MESSAGES.ERROR.FORBIDDEN);
    }

    // Update fields
    if (status) {
      // Validate transition
      const validation = validateStatusTransition(booking.status, status);
      if (validation !== true) {
        return NextResponse.json(
          { success: false, message: validation },
          { status: 400 }
        );
      }

      booking.status = status;
      if (status === "in_progress") {
        booking.startedAt = new Date();
      }

      if (status === "completed") {
        booking.completedAt = new Date();

        // Award points
        try {
          if (booking.actualCost && booking.actualCost > 0) {
            const customer = await User.findById(booking.user);
            let multiplier = 1;

            if (customer) {
              if (["enterprise", "premium"].includes(customer.membershipTier)) {
                multiplier = 10;
              } else if (customer.membershipTier === "standard") {
                multiplier = 5;
              }
            }

            const pointsEarned = Math.floor(
              (booking.actualCost / 100) * multiplier
            );

            if (pointsEarned > 0) {
              await User.findByIdAndUpdate(booking.user, {
                $inc: {
                  rewardPoints: pointsEarned,
                  totalBookings: 1,
                  totalSpent: booking.actualCost,
                },
              });

              await PointsRecord.create({
                user: booking.user,
                points: pointsEarned,
                type: "earn",
                reason: `Completed Service #${
                  booking.bookingNumber || booking._id
                } (${multiplier}x Tier Bonus)`,
                metadata: {
                  bookingId: booking._id,
                  cost: booking.actualCost,
                  tier: customer?.membershipTier || "free",
                },
              });
            }
          }
        } catch (pointError) {
          console.error("Failed to award points:", pointError);
        }
      } else if (status === "cancelled") {
        booking.cancelledAt = new Date();
        if (booking.status === "in_progress" || booking.startedAt) {
          const cancellationFee = 100;
          booking.billItems.push({
            description: "Late Cancellation Fee",
            amount: cancellationFee,
            category: "other",
          });
          booking.actualCost = (booking.actualCost || 0) + cancellationFee;
          booking.cancellationReason =
            booking.cancellationReason || "Cancelled after service started";
        }
      }
    }
    if (actualCost !== undefined) booking.actualCost = actualCost;
    if (billItems !== undefined) booking.billItems = billItems;
    if (towingRequested !== undefined)
      booking.towingRequested = towingRequested;

    if (towingCost !== undefined) {
      const customerForTowing = await User.findById(booking.user);
      if (
        customerForTowing &&
        ["enterprise", "premium"].includes(customerForTowing.membershipTier)
      ) {
        booking.towingCost = 0;
      } else {
        booking.towingCost = towingCost;
      }
    }
    if (notes) booking.notes = notes;

    // Handle mechanic assignment
    if (assignedMechanic) {
      const mechanicUser = await User.findById(assignedMechanic);
      if (
        mechanicUser &&
        mechanicUser.garageId.toString() === booking.garage._id.toString()
      ) {
        booking.assignedMechanic = assignedMechanic;
        booking.status = "confirmed";

        await Notification.create({
          recipient: assignedMechanic,
          type: "system_alert",
          title: "New Job Assigned 🛠️",
          message: `You have been assigned to Booking #${booking.bookingNumber}`,
          link: `/mechanic/dashboard/bookings/${booking._id}`,
        });
      }
    }

    await booking.save();

    // Create notification for user
    if (status) {
      try {
        await Notification.create({
          recipient: booking.user,
          type: "booking_update",
          title: "Booking Status Updated",
          message: `Your booking #${
            booking.bookingNumber || booking._id
          } has been updated to: ${status}`,
          link: `/user/dashboard/bookings/${booking._id}`,
          metadata: { bookingId: booking._id, status },
        });

        if (status === "cancelled" && booking.assignedMechanic) {
          await Notification.create({
            recipient: booking.assignedMechanic,
            type: "system_alert",
            title: "Job Cancelled ❌",
            message: `Booking #${
              booking.bookingNumber || booking._id
            } has been cancelled.`,
            link: `/mechanic/dashboard`,
          });
        }
      } catch (err) {
        console.error("Failed to create notification:", err);
      }
    }

    return successResponse(
      { booking },
      `বুকিং আপডেট হয়েছে: ${status || "সফল"}`
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/bookings/[id]
 * Delete/Cancel a booking
 */
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    // Require authentication
    const currentUser = await requireAuth(request);
    const { id } = await params;

    const booking = await Booking.findById(id);
    if (!booking) {
      throw new NotFoundError(MESSAGES.ERROR.BOOKING_NOT_FOUND);
    }

    // Authorization check - Only admin or booking owner can delete
    let isAuthorized = false;

    if (currentUser.role === "admin") {
      isAuthorized = true;
    } else if (booking.user.toString() === currentUser.userId) {
      // User can only delete if booking is still pending
      if (booking.status === "pending") {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenError(
        "শুধুমাত্র অ্যাডমিন অথবা pending বুকিং এর মালিক মুছে ফেলতে পারবেন"
      );
    }

    // Soft delete - mark as cancelled instead of hard delete
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = "Deleted by user/admin";
    await booking.save();

    // Notify garage if assigned
    if (booking.garage) {
      try {
        const garage = await Garage.findById(booking.garage);
        if (garage && garage.owner) {
          await Notification.create({
            recipient: garage.owner,
            type: "booking_update",
            title: "Booking Cancelled",
            message: `Booking #${
              booking.bookingNumber || booking._id
            } has been cancelled.`,
            link: `/garage/dashboard/bookings`,
            metadata: { bookingId: booking._id },
          });
        }
      } catch (err) {
        console.error("Failed to notify garage:", err);
      }
    }

    return successResponse({ bookingId: id }, "বুকিং বাতিল করা হয়েছে");
  } catch (error) {
    return handleError(error);
  }
}
