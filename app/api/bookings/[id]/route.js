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
import { verifyToken } from "@/lib/utils/auth";
import { validateStatusTransition } from "@/lib/utils/bookingHelpers";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const booking = await Booking.findById(id)
      .populate("garage", "name rating address images logo owner")
      .populate("user", "name email phone avatar");

    // Fetch review separately if exists
    const review = await Review.findOne({ booking: id });
    // Fetch latest payment info
    const payment = await Payment.findOne({ bookingId: id }).sort({
      createdAt: -1,
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Authorization check
    let isAuthorized = false;

    if (decoded.role === "admin") {
      isAuthorized = true;
    } else if (booking.user._id.toString() === decoded.userId) {
      isAuthorized = true;
    } else if (
      booking.garage &&
      booking.garage.owner &&
      booking.garage.owner.toString() === decoded.userId
    ) {
      isAuthorized = true;
    } else if (
      decoded.role === "mechanic" &&
      booking.assignedMechanic?.toString() === decoded.userId
    ) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        ...booking.toObject(),
        review: review,
        paymentInfo: payment,
      },
    });
  } catch (error) {
    console.error("Booking GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (
      !decoded ||
      (decoded.role !== "admin" &&
        decoded.role !== "garage" &&
        decoded.role !== "mechanic")
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      status,
      actualCost,
      notes,
      billItems,
      towingRequested,
      towingCost,
      assignedMechanic, // Allow updating assigned mechanic
    } = body;

    const booking = await Booking.findById(id).populate("garage", "owner");
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Authorization check for garage & mechanic
    if (
      decoded.role === "garage" &&
      booking.garage?.owner?.toString() !== decoded.userId
    ) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Not your booking" },
        { status: 403 }
      );
    }

    if (
      decoded.role === "mechanic" &&
      booking.assignedMechanic?.toString() !== decoded.userId
    ) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Not assigned to this job" },
        { status: 403 }
      );
    }

    // Update fields
    if (status) {
      // STRICT STATE MACHINE: Validate transition
      const validation = validateStatusTransition(booking.status, status);
      if (validation !== true) {
        return NextResponse.json(
          { success: false, message: validation },
          { status: 400 }
        );
      }

      booking.status = status;
      if (status === "completed") {
        booking.completedAt = new Date();

        // Award points to user
        try {
          const pointsAwarded = 50;
          const pointUser = await User.findById(booking.user);
          if (pointUser) {
            pointUser.rewardPoints =
              (pointUser.rewardPoints || 0) + pointsAwarded;
            await pointUser.save();
          }

          await PointsRecord.create({
            user: booking.user,
            points: pointsAwarded,
            type: "earn",
            reason: "Completed a service booking",
            metadata: { bookingId: booking._id },
          });

          await Notification.create({
            recipient: booking.user,
            type: "system_alert",
            title: "🏆 Points Earned!",
            message: `Congratulations! You earned ${pointsAwarded} points for completing your service.`,
            link: `/user/dashboard/bookings/${booking._id}`,
          });
        } catch (pointsErr) {
          console.error(
            "Failed to award points to user on booking completion:",
            pointsErr
          );
        }

        // Award points to Garage Owner
        try {
          const garagePointsAwarded = 100; // Check business logic for exact amount
          const garageOwner = await User.findById(booking.garage.owner);

          if (garageOwner) {
            garageOwner.rewardPoints =
              (garageOwner.rewardPoints || 0) + garagePointsAwarded;
            await garageOwner.save();

            await PointsRecord.create({
              user: booking.garage.owner,
              points: garagePointsAwarded,
              type: "earn",
              reason: "Completed a service booking",
              metadata: { bookingId: booking._id, role: "garage" },
            });

            await Notification.create({
              recipient: booking.garage.owner,
              type: "system_alert",
              title: "🏆 Points Earned!",
              message: `Great job! You earned ${garagePointsAwarded} points for completing a service.`,
              link: `/garage/dashboard/bookings/${booking._id}`,
            });
          }
        } catch (garagePointsErr) {
          console.error(
            "Failed to award points to garage on booking completion:",
            garagePointsErr
          );
        }
      } else if (status === "cancelled") {
        booking.cancelledAt = new Date();
        // CANCELLATION POLICY: If cancelled after start, charge fee
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
    if (towingCost !== undefined) booking.towingCost = towingCost;
    if (notes) booking.notes = notes;

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
      } catch (err) {
        console.error("Failed to create status update notification:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Booking updated to ${status}`,
      booking,
    });
  } catch (error) {
    console.error("Booking PATCH error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
