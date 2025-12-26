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
      .populate("user", "name email phone avatar")
      .populate({
        path: "assignedMechanic",
        select: "name phone avatar",
        strictPopulate: false,
      }); // Populate Mechanic safely

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

    if (!decoded) {
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

    // Authorization check
    let isAuthorized = false;

    if (decoded.role === "admin") {
      isAuthorized = true;
    } else if (
      decoded.role === "garage" &&
      booking.garage?.owner?.toString() === decoded.userId
    ) {
      isAuthorized = true;
    } else if (
      decoded.role === "mechanic" &&
      booking.assignedMechanic?.toString() === decoded.userId
    ) {
      isAuthorized = true;
    } else if (
      // Allow USER to update (e.g. cancel) their OWN booking
      decoded.role === "user" &&
      booking.user?.toString() === decoded.userId
    ) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You do not have permission" },
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
      if (status === "in_progress") {
        booking.startedAt = new Date();
      }

      if (status === "completed") {
        booking.completedAt = new Date();
        // ... (points logic)
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

    // Handle Manual Assignment
    if (assignedMechanic) {
      // Validate that the mechanic belongs to this garage (security check)
      const mechanicUser = await User.findById(assignedMechanic);
      if (
        mechanicUser &&
        mechanicUser.garageId.toString() === booking.garage._id.toString()
      ) {
        booking.assignedMechanic = assignedMechanic;
        booking.status = "confirmed"; // Auto-confirm if assigned

        // Notify Mechanic
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

        // Notify Assigned Mechanic if Cancelled
        if (status === "cancelled" && booking.assignedMechanic) {
          await Notification.create({
            recipient: booking.assignedMechanic,
            type: "system_alert",
            title: "Job Cancelled ❌",
            message: `Booking #${
              booking.bookingNumber || booking._id
            } has been cancelled by the user/admin.`,
            link: `/mechanic/dashboard`,
          });
        } else if (
          status &&
          booking.assignedMechanic &&
          decoded.userId !== booking.assignedMechanic.toString()
        ) {
          // General status update notification for mechanic (if not updated by themselves)
          await Notification.create({
            recipient: booking.assignedMechanic,
            type: "system_alert",
            title: "Booking Updated 🔔",
            message: `Booking #${
              booking.bookingNumber || booking._id
            } status updated to: ${status}`,
            link: `/mechanic/dashboard/bookings/${booking._id}`,
          });
        }
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
