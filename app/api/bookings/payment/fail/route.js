import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Payment from "@/lib/db/models/Payment";
import Booking from "@/lib/db/models/Booking";

export async function POST(request) {
  try {
    await connectDB();
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const { tran_id, value_b, error } = data; // value_b is bookingId

    // Find payment record
    const payment = await Payment.findOne({
      "sslcommerz.transactionId": tran_id,
    });

    if (payment) {
      // Update payment status to failed
      await Payment.findByIdAndUpdate(payment._id, {
        status: "failed",
        errorMessage: error || "Payment failed",
        "sslcommerz.failedOn": new Date(),
      });
    }

    // Redirect user back to booking page with error message
    const redirectUrl = value_b
      ? `${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard/bookings/${value_b}?payment=failed`
      : `${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard?payment=failed`;

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Booking Payment Fail Handler Error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard?payment=error`
    );
  }
}
