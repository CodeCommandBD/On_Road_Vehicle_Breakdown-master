import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import SSLCommerzPayment from "sslcommerz-lts";
import Payment from "@/lib/db/models/Payment";
import Subscription from "@/lib/db/models/Subscription";
import User from "@/lib/db/models/User";

export async function POST(request) {
  try {
    await connectDB();

    // Get form data from SSLCommerz callback
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const {
      tran_id,
      val_id,
      amount,
      card_type,
      card_brand,
      bank_tran_id,
      status,
      value_a, // payment ID
      value_b, // subscription ID
      value_c, // billing cycle
    } = data;

    console.log("Payment success callback received:", { tran_id, status });

    // Find payment record
    const payment = await Payment.findById(value_a);
    if (!payment) {
      console.error("Payment not found:", value_a);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?error=payment_not_found`
      );
    }

    // Find subscription
    const subscription = await Subscription.findById(value_b);
    if (!subscription) {
      console.error("Subscription not found:", value_b);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?error=subscription_not_found`
      );
    }

    // Validate transaction with SSLCommerz
    const store_id = process.env.SSLCOMMERZ_STORE_ID;
    const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const is_live = process.env.SSLCOMMERZ_IS_LIVE === "true";

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const validation = await sslcz.validate({ val_id });

    // Check if payment is valid
    if (validation.status === "VALID" || validation.status === "VALIDATED") {
      // Update payment record
      await Payment.findByIdAndUpdate(payment._id, {
        status: "success",
        "sslcommerz.transactionId": tran_id,
        "sslcommerz.bankTransactionId": bank_tran_id,
        "sslcommerz.cardType": card_type,
        "sslcommerz.cardBrand": card_brand,
        "sslcommerz.validatedOn": new Date(),
        paidAt: new Date(),
      });

      // Activate subscription
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: "active",
        transactionId: tran_id,
      });

      // Update user membership
      const user = await User.findById(subscription.userId);
      if (user) {
        const plan = await subscription.populate("planId");
        await User.findByIdAndUpdate(user._id, {
          membershipTier: plan.planId.tier,
          membershipExpiry: subscription.endDate,
          currentSubscription: subscription._id,
        });
      }

      console.log("Payment successful:", tran_id);

      // Redirect to success page
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?transaction=${tran_id}&plan=${subscription.planId}&cycle=${value_c}`
      );
    } else {
      // Validation failed
      console.error("Payment validation failed:", validation);

      await Payment.findByIdAndUpdate(payment._id, {
        status: "failed",
        errorMessage: "Payment validation failed",
      });

      await Subscription.findByIdAndUpdate(subscription._id, {
        status: "cancelled",
      });

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?error=validation_failed`
      );
    }
  } catch (error) {
    console.error("Payment success callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?error=server_error`
    );
  }
}
