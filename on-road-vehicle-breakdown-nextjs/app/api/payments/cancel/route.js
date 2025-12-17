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
      value_a, // payment ID
      value_b, // subscription ID
    } = data;

    console.log("Payment cancelled callback received:", { tran_id });

    // Update payment status
    if (value_a) {
      await Payment.findByIdAndUpdate(value_a, {
        status: "cancelled",
      });
    }

    // Cancel subscription
    if (value_b) {
      await Subscription.findByIdAndUpdate(value_b, {
        status: "cancelled",
        cancellationReason: "User cancelled payment",
      });
    }

    // Redirect back to pricing page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`
    );
  } catch (error) {
    console.error("Payment cancel callback error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/pricing`);
  }
}
