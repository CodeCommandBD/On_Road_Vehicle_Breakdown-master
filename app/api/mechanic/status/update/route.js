import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import { verifyToken } from "@/lib/utils/auth";
import Notification from "@/lib/db/models/Notification";

export async function POST(request) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "mechanic") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { bookingId, status } = await request.json();

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      assignedMechanic: decoded.userId,
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found or not assigned to you" },
        { status: 404 }
      );
    }

    booking.status = status;
    await booking.save();

    // Create Notification for User
    let message = "";
    if (status === "on_the_way") message = "Mechanic is on the way! 🚗";
    if (status === "diagnosing")
      message = "Mechanic has arrived and is diagnosing the issue. 🔧";

    if (message) {
      if (message) {
        const { sendNotification } = await import(
          "@/lib/utils/notificationHelper"
        );
        await sendNotification({
          recipientId: booking.user,
          senderId: decoded.userId,
          type: "info",
          title: "Status Update",
          message: message,
          link: `/user/dashboard/bookings/${booking._id}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Status updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Status update error details:", error); // Log full error object
    return NextResponse.json(
      { success: false, message: `Server Error: ${error.message}` }, // Return actionable error
      { status: 500 }
    );
  }
}
