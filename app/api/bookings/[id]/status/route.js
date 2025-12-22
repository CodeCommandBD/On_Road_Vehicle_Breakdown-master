import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import Garage from "@/lib/db/models/Garage";
import { verifyToken } from "@/lib/utils/auth";
import { triggerWebhook } from "@/lib/utils/webhook";

// PATCH /api/bookings/[id]/status - Update booking status
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

    const { id } = params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = [
      "pending",
      "accepted",
      "in-progress",
      "completed",
      "canceled",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    // Find booking and populate garage
    const booking = await Booking.findById(id).populate("garage");
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Authorization check: Only garage owner can update booking status
    if (booking.garage.owner.toString() !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to update this booking" },
        { status: 403 }
      );
    }

    // Update booking status
    booking.status = status;
    await booking.save();

    // If booking is completed, increment garage completedBookings count
    if (status === "completed") {
      await Garage.findByIdAndUpdate(booking.garage._id, {
        $inc: { completedBookings: 1 },
      });
    }

    // --- TRIGGER WEBHOOKS ---
    const webhookPayload = {
      bookingId: booking._id,
      status: booking.status,
      user: booking.user?._id || booking.user,
      garage: booking.garage?._id || booking.garage,
      updatedAt: new Date().toISOString(),
    };

    // Notify User
    triggerWebhook(
      booking.user?._id || booking.user,
      "booking.updated",
      webhookPayload
    );
    // Notify Garage
    await triggerWebhook(
      null,
      "booking.updated",
      webhookPayload,
      booking.garage?._id || booking.garage
    );

    // Specifically Notify booking.completed if status is completed
    if (status === "completed") {
      await triggerWebhook(
        booking.user?._id || booking.user,
        "booking.completed",
        webhookPayload
      );
      if (booking.garage) {
        await triggerWebhook(
          null,
          "booking.completed",
          webhookPayload,
          booking.garage?._id || booking.garage
        );
      }
    }
    // ------------------------

    // Return updated booking
    const updatedBooking = await Booking.findById(id)
      .populate("user", "name email phone")
      .populate("garage", "name address phone")
      .populate("service", "name");

    return NextResponse.json(
      {
        success: true,
        message: `Booking ${status} successfully`,
        booking: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Booking status update error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
