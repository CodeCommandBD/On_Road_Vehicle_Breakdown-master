import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Payment from "@/lib/db/models/Payment";
import Booking from "@/lib/db/models/Booking";

export async function POST(request) {
  try {
    await connectDB();
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const { tran_id, status, value_a, value_b } = data; // value_b is bookingId

    const payment = await Payment.findOne({
      "sslcommerz.transactionId": tran_id,
    });

    if (!payment) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?error=payment_not_found`
      );
    }

    if (status === "VALID" || status === "VALIDATED") {
      await Payment.findByIdAndUpdate(payment._id, {
        status: "success",
        paidAt: new Date(),
        "sslcommerz.validatedOn": new Date(),
      });

      // Update Booking - Payment Submitted, Awaiting Approval
      const booking = await Booking.findByIdAndUpdate(
        value_b,
        {
          isPaid: false,
          status: "payment_pending",
          isPaymentSubmitted: true,
          isPaymentApproved: false,
          paymentDetails: {
            transactionId: tran_id,
            amount: payment.amount,
            method: "sslcommerz",
            submittedAt: new Date(),
          },
        },
        { new: true }
      ).populate("garage assignedMechanic");

      // Notify Mechanic - Payment received, needs approval
      if (booking.assignedMechanic) {
        try {
          const Notification = (await import("@/lib/db/models/Notification"))
            .default;
          await Notification.create({
            recipient: booking.assignedMechanic,
            type: "info",
            title: "Payment Received 💰",
            message: `Online payment of ৳${payment.amount} received for Booking #${booking.bookingNumber} (TrxID: ${tran_id}). Please verify and confirm.`,
            link: `/mechanic/dashboard`,
          });
        } catch (err) {
          console.error("Failed to notify mechanic:", err);
        }
      }

      // Notify Garage Owner
      if (booking?.garage?.owner) {
        try {
          const Notification = (await import("@/lib/db/models/Notification"))
            .default;
          await Notification.create({
            recipient: booking.garage.owner,
            type: "info",
            title: "Payment Received ৳",
            message: `Online payment of ৳${payment.amount} received for Booking #${booking.bookingNumber} (TrxID: ${tran_id}). Awaiting verification.`,
            link: `/garage/dashboard/bookings/${booking._id}`,
            metadata: { bookingId: booking._id, amount: payment.amount },
          });
        } catch (notifError) {
          console.error("Failed to send payment notification:", notifError);
        }
      }

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard/bookings/${value_b}?payment=success`
      );
    } else {
      await Payment.findByIdAndUpdate(payment._id, { status: "failed" });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard/bookings/${value_b}?payment=failed`
      );
    }
  } catch (error) {
    console.error("Booking Payment Success Error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail`
    );
  }
}
