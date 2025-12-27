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

    if (!decoded || decoded.role !== "user") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { bookingId, action } = await request.json(); // action: 'approve' or 'reject'

    const booking = await Booking.findOne({
      _id: bookingId,
      user: decoded.userId,
    }); // FIXED: was decoded.id

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.status !== "estimate_sent") {
      return NextResponse.json(
        { success: false, message: "Invalid booking status" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      booking.status = "in_progress";
      booking.startedAt = new Date();

      // Notify Mechanic
      const { sendNotification } = await import(
        "@/lib/utils/notificationHelper"
      );
      await sendNotification({
        recipientId: booking.assignedMechanic,
        senderId: decoded.userId,
        type: "success",
        title: "Estimate Approved ✅",
        message: "User approved the estimate. Please start the work.",
        link: `/mechanic/dashboard`,
      });
    } else if (action === "reject") {
      booking.status = "payment_pending";
      booking.actualCost = 150; // Visit fee
      booking.billItems = [
        {
          description: "Visit Fee (Job Rejected)",
          amount: 150,
          category: "labor",
        },
      ];
      booking.completedAt = new Date(); // Job essentially ends here

      // Notify Mechanic
      const { sendNotification } = await import(
        "@/lib/utils/notificationHelper"
      );
      await sendNotification({
        recipientId: booking.assignedMechanic,
        senderId: decoded.userId,
        type: "action_required", // Critical alert for mechanic
        title: "Estimate Rejected ❌",
        message: "User rejected the estimate. Collect Visit Fee (150 TK).",
        link: `/mechanic/dashboard`,
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }

    await booking.save();

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "Job started"
          : "Job cancelled, visit fee pending",
    });
  } catch (error) {
    console.error("Estimate response error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
