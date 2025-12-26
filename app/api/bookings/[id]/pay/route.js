import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import Payment from "@/lib/db/models/Payment";
import Notification from "@/lib/db/models/Notification";
import { verifyToken } from "@/lib/utils/auth";

// POST: User submits payment (TrxID)
// POST: Submit payment
export async function POST(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { paymentMethod, transactionId, amount } = body;

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const booking = await Booking.findById(id).populate("garage");
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Determine Payer and Status
    // If Garage/Admin initiates, it's a confirmation of receipt (Success)
    // If User initiates, it's a submission (Pending)
    const isGarageOrAdmin =
      decoded.role === "garage" || decoded.role === "admin";
    const payerId = isGarageOrAdmin ? booking.user : decoded.userId;
    const initialStatus = isGarageOrAdmin ? "success" : "pending";

    // Calculate Commission (Standard 15%, Premium/Enterprise 5% -> "10% Reduced")
    const garageTier = booking.garage?.membershipTier || "free";
    const commissionRate =
      garageTier === "premium" || garageTier === "enterprise" ? 0.05 : 0.15;
    const paymentAmount = amount || booking.actualCost || booking.estimatedCost;
    const platformFee = Math.round(paymentAmount * commissionRate);
    const netEarnings = paymentAmount - platformFee;

    // Create Manual Payment Record
    const payment = await Payment.create({
      userId: payerId,
      bookingId: id,
      type: "service_fee",
      amount: paymentAmount,
      paymentMethod: paymentMethod || "manual",
      transactionId: transactionId,
      status: initialStatus,
      paidAt: initialStatus === "success" ? new Date() : null,
      metadata: {
        description: `Payment for Booking #${booking.bookingNumber}`,
        initiatedBy: decoded.role,
        commissionRate,
        platformFee,
        netGarageEarnings: netEarnings,
      },
      errorMessage: null, // Clear any previous error
    });

    // Handle Auto-Verification (For Garage/Admin)
    if (initialStatus === "success") {
      await Booking.findByIdAndUpdate(id, {
        isPaid: true,
        paymentInfo: {
          status: "success",
          transactionId: transactionId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paidAt: new Date(),
        },
      });

      // Notify User
      try {
        await Notification.create({
          recipient: booking.user,
          type: "payment_success",
          title: "Payment Received ✅",
          message: `Garage has confirmed your payment of ৳${payment.amount}.`,
          link: `/user/dashboard/bookings/${id}`,
        });
      } catch (err) {
        console.error("Failed to notify user:", err);
      }
    } else {
      // Handle User Submission (Notify Garage)
      if (booking.garage?.owner) {
        try {
          await Notification.create({
            recipient: booking.garage.owner,
            type: "payment_update",
            title: "Payment Submitted",
            message: `User submitted payment (TrxID: ${transactionId}). Please verify.`,
            link: `/garage/dashboard/bookings/${id}`,
            metadata: { bookingId: id, paymentId: payment._id },
          });
        } catch (err) {
          console.error("Failed to notify garage:", err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message:
        initialStatus === "success"
          ? "Payment recorded and verified"
          : "Payment submitted for verification",
      payment,
    });
  } catch (error) {
    console.error("Payment Submission Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Garage verifies payment
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status, paymentId } = body; // status: 'success' or 'failed'

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || (decoded.role !== "garage" && decoded.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment info not found" },
        { status: 404 }
      );
    }

    payment.status = status;
    if (status === "success") {
      payment.paidAt = new Date();
    }
    await payment.save();

    // If success, update Booking
    if (status === "success") {
      await Booking.findByIdAndUpdate(id, {
        isPaid: true,
        paymentMethod: payment.paymentMethod,
      });

      // Notify User
      await Notification.create({
        recipient: payment.userId,
        type: "payment_update",
        title: "Payment Verified",
        message: `Your payment has been verified successfully.`,
        link: `/user/dashboard/bookings/${id}`,
      });
    } else if (status === "failed") {
      // Notify User of Rejection
      await Notification.create({
        recipient: payment.userId,
        type: "payment_update",
        title: "Payment Rejected",
        message: `Your payment verification failed. Please contact the garage.`,
        link: `/user/dashboard/bookings/${id}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Payment marked as ${status}`,
    });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
