import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import Payment from "@/lib/db/models/Payment";
import User from "@/lib/db/models/User";
import PointsRecord from "@/lib/db/models/PointsRecord";
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

    const { bookingId, method } = await request.json(); // method: 'cash' or 'online'

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

    if (method === "cash") {
      booking.isPaid = true;
      booking.paymentMethod = "cash";
      booking.status = "completed"; // Fully complete now
      booking.completedAt = new Date(); // Set completion timestamp for stats

      // Create Payment Record for consistency
      await Payment.create({
        userId: booking.user,
        bookingId: booking._id,
        type: "service_fee",
        amount: booking.actualCost || booking.estimatedCost,
        paymentMethod: "cash",
        status: "success",
        paidAt: new Date(),
        metadata: {
          receivedBy: decoded.userId, // Mechanic ID
          description: "Cash collected by mechanic",
        },
      });

      // Award Points with Tier-Based Multiplier ("Cashback")
      const costForPoints = booking.actualCost || booking.estimatedCost || 0;

      // Fetch user to check tier
      const customer = await User.findById(booking.user);
      let multiplier = 1;

      if (customer) {
        if (["enterprise", "premium"].includes(customer.membershipTier)) {
          multiplier = 10; // 10% equivalent
        } else if (customer.membershipTier === "standard") {
          multiplier = 5; // 5% equivalent
        }
      }

      const pointsEarned = Math.floor((costForPoints / 100) * multiplier);

      if (pointsEarned > 0) {
        // Update User Points & Stats
        await User.findByIdAndUpdate(booking.user, {
          $inc: {
            rewardPoints: pointsEarned,
            totalBookings: 1,
            totalSpent: costForPoints,
          },
        });

        // Create Record
        await PointsRecord.create({
          user: booking.user,
          points: pointsEarned,
          type: "earn",
          reason: `Completed Service: ${booking.bookingNumber} (${multiplier}x Tier Bonus)`,
          metadata: {
            bookingId: booking._id,
            cost: costForPoints,
            tier: customer?.membershipTier || "free",
          },
        });

        console.log(
          `🏆 Awarded ${pointsEarned} points to user ${booking.user} (Tier: ${customer?.membershipTier}, Multiplier: ${multiplier}x)`
        );
      }

      // Notify User
      const { sendNotification } = await import(
        "@/lib/utils/notificationHelper"
      );
      await sendNotification({
        recipientId: booking.user,
        senderId: decoded.userId,
        type: "success",
        title: "Payment Received",
        message: "Mechanic confirmed cash payment. Thank you!",
        link: `/user/dashboard/bookings/${booking._id}`,
      });
    } else if (method === "online") {
      // For online, we assume the system/gateway has already processed it.
      if (booking.isPaid) {
        booking.status = "completed";
        booking.completedAt = new Date(); // Set completion timestamp for stats

        // Award Points for Online Payment with Multiplier
        const costForPoints = booking.actualCost || booking.estimatedCost || 0;

        const customer = await User.findById(booking.user);
        let multiplier = 1;

        if (customer) {
          if (["enterprise", "premium"].includes(customer.membershipTier)) {
            multiplier = 10;
          } else if (customer.membershipTier === "standard") {
            multiplier = 5;
          }
        }

        const pointsEarned = Math.floor((costForPoints / 100) * multiplier);

        if (pointsEarned > 0) {
          await User.findByIdAndUpdate(booking.user, {
            $inc: {
              rewardPoints: pointsEarned,
              totalBookings: 1,
              totalSpent: costForPoints,
            },
          });

          await PointsRecord.create({
            user: booking.user,
            points: pointsEarned,
            type: "earn",
            reason: `Completed Service (Online): ${booking.bookingNumber} (${multiplier}x Tier Bonus)`,
            metadata: {
              bookingId: booking._id,
              cost: costForPoints,
              tier: customer?.membershipTier || "free",
            },
          });
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Online payment not yet verified by system",
          },
          { status: 400 }
        );
      }
    }

    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Payment confirmed, job completed",
    });
  } catch (error) {
    console.error("Payment confirm error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
