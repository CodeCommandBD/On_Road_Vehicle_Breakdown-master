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

    // Sanitize base URL for redirect
    let baseUrl =
      request.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    baseUrl = baseUrl.replace(/\/$/, "");

    // Redirect to fail page with cancel reason and 303 status
    return NextResponse.redirect(
      `${baseUrl}/payment/fail?error=payment_cancelled`,
      { status: 303 }
    );
  } catch (error) {
    console.error("Payment cancel callback error:", error);
    let baseUrl =
      request.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    baseUrl = baseUrl.replace(/\/$/, "");
    return NextResponse.redirect(`${baseUrl}/payment/fail?error=server_error`, {
      status: 303,
    });
  }
}
