import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import Garage from "@/lib/db/models/Garage";
import Review from "@/lib/db/models/Review";
import Notification from "@/lib/db/models/Notification";
import PointsRecord from "@/lib/db/models/PointsRecord";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";

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
      .populate("garage", "name rating address images logo")
      .populate("user", "name email phone avatar");

    // Fetch review separately if exists
    const review = await Review.findOne({ booking: id });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Authorization check
    if (
      decoded.role !== "admin" &&
      booking.user._id.toString() !== decoded.userId &&
      booking.garage?._id.toString() !== decoded.garageId
    ) {
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

    if (!decoded || (decoded.role !== "admin" && decoded.role !== "garage")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, actualCost, notes } = body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Authorization check for garage
    if (
      decoded.role === "garage" &&
      booking.garage.toString() !== decoded.garageId
    ) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Not your booking" },
        { status: 403 }
      );
    }

    // Update fields
    if (status) {
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
            "Failed to award points on booking completion:",
            pointsErr
          );
        }
      }
    }
    if (actualCost !== undefined) booking.actualCost = actualCost;
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
