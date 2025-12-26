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

    const { bookingId, totalCost, items } = await request.json();

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

    booking.actualCost = totalCost;
    if (items) booking.billItems = items;
    booking.status = "payment_pending";
    booking.completedAt = new Date(); // Mark work as done

    await booking.save();

    // Notify User
    await Notification.create({
      recipient: booking.user,
      sender: decoded.userId,
      type: "action_required",
      title: "Bill Ready",
      message: `Total Bill: ৳${totalCost}. Please make payment.`,
      link: `/user/dashboard/bookings/${booking._id}`,
    });

    return NextResponse.json({
      success: true,
      message: "Bill updated, waiting for payment",
    });
  } catch (error) {
    console.error("Bill update error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
