import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Payment from "@/lib/db/models/Payment";
import Subscription from "@/lib/db/models/Subscription";

export async function POST(request) {
  try {
    await connectDB();

    // Get form data from SSLCommerz callback
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const {
      tran_id,
      error,
      value_a, // payment ID
      value_b, // subscription ID
    } = data;

    console.log("Payment failed callback received:", { tran_id, error });

    // Update payment status
    if (value_a) {
      await Payment.findByIdAndUpdate(value_a, {
        status: "failed",
        errorMessage: error || "Payment failed",
      });
    }

    // Cancel subscription
    if (value_b) {
      await Subscription.findByIdAndUpdate(value_b, {
        status: "cancelled",
        cancellationReason: "Payment failed",
      });
    }

    // Redirect to fail page
    return NextResponse.redirect(
      `${
        process.env.NEXT_PUBLIC_APP_URL
      }/payment/fail?transaction=${tran_id}&reason=${encodeURIComponent(
        error || "Payment failed"
      )}`
    );
  } catch (error) {
    console.error("Payment fail callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?error=callback_error`
    );
  }
}
