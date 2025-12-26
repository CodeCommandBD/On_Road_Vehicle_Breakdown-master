import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Payment from "@/lib/db/models/Payment";
import Booking from "@/lib/db/models/Booking";
import Notification from "@/lib/db/models/Notification";

export async function POST(request) {
  try {
    await connectDB();
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const { tran_id, status, value_a, value_b, val_id } = data;
    // value_a = payment._id
    // value_b = bookingId
    // val_id = SSLCommerz validation ID

    console.log("IPN Received:", { tran_id, status, value_b });

    // Find payment record
    const payment = await Payment.findOne({
      "sslcommerz.transactionId": tran_id,
    });

    if (!payment) {
      console.error("IPN: Payment not found for transaction:", tran_id);
      return NextResponse.json({
        success: false,
        message: "Payment not found",
      });
    }

    // Validate payment with SSLCommerz
    const store_id = process.env.SSLCOMMERZ_STORE_ID;
    const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const is_live = process.env.SSLCOMMERZ_IS_LIVE === "true";

    const validationUrl = is_live
      ? `https://securepay.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${store_id}&store_passwd=${store_passwd}&format=json`
      : `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${store_id}&store_passwd=${store_passwd}&format=json`;

    const validationResponse = await fetch(validationUrl);
    const validationResult = await validationResponse.json();

    console.log("IPN Validation Result:", validationResult);

    // Check if payment is valid
    if (
      validationResult.status === "VALID" ||
      validationResult.status === "VALIDATED"
    ) {
      // Update payment record
      await Payment.findByIdAndUpdate(payment._id, {
        status: "success",
        paidAt: new Date(),
        "sslcommerz.validatedOn": new Date(),
        "sslcommerz.validationId": val_id,
      });

      // Update booking
      const booking = await Booking.findByIdAndUpdate(
        value_b,
        {
          isPaid: true,
          status: "completed",
          completedAt: new Date(),
          paymentInfo: {
            status: "success",
            transactionId: tran_id,
            amount: payment.amount,
            paymentMethod: "sslcommerz",
            paidAt: new Date(),
          },
        },
        { new: true }
      ).populate("user assignedMechanic");

      if (booking) {
        // Notify user
        await Notification.create({
          recipient: booking.user._id,
          type: "payment_success",
          title: "Payment Successful ✅",
          message: `Your payment of ৳${payment.amount} has been confirmed. Service completed!`,
          link: `/user/dashboard/bookings/${booking._id}`,
        });

        // Notify mechanic
        if (booking.assignedMechanic) {
          await Notification.create({
            recipient: booking.assignedMechanic,
            type: "payment_success",
            title: "Payment Received 💰",
            message: `Payment of ৳${payment.amount} confirmed for Booking #${booking.bookingNumber}`,
            link: `/mechanic/dashboard`,
          });
        }

        console.log("IPN: Booking updated successfully:", booking._id);
      }

      return NextResponse.json({ success: true, message: "Payment validated" });
    } else {
      // Payment validation failed
      await Payment.findByIdAndUpdate(payment._id, {
        status: "failed",
        errorMessage: "Payment validation failed",
      });

      console.error("IPN: Payment validation failed:", validationResult);
      return NextResponse.json({
        success: false,
        message: "Payment validation failed",
      });
    }
  } catch (error) {
    console.error("IPN Handler Error:", error);
    return NextResponse.json({
      success: false,
      message: "IPN processing failed",
      error: error.message,
    });
  }
}
