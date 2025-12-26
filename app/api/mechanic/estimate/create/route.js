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

    const { bookingId, items, totalCost } = await request.json();

    if (!bookingId || !items || !items.length) {
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
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    booking.billItems = items;
    booking.estimatedCost = totalCost;
    booking.actualCost = totalCost; // Set actual cost same as estimate
    booking.status = "payment_pending"; // Skip estimate_sent, go directly to payment_pending
    await booking.save();

    // Notify User
    await Notification.create({
      recipient: booking.user,
      sender: decoded.userId,
      type: "action_required",
      title: "Cost Estimate Received",
      message: `Mechanic sent an estimate of ৳${totalCost}. Please approve or reject.`,
      link: `/user/dashboard/bookings/${booking._id}`,
    });

    return NextResponse.json({
      success: true,
      message: "Estimate sent to user",
    });
  } catch (error) {
    console.error("Estimate creation error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
