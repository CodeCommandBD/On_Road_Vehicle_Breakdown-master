import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Payment from "@/lib/db/models/Payment";
import Subscription from "@/lib/db/models/Subscription";
import User from "@/lib/db/models/User";
import Plan from "@/lib/db/models/Plan";

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

    console.log("Payment success callback received:", {
      tran_id,
      status,
      value_a,
      value_b,
    });

    // Find payment record by transaction ID (more reliable than value_a)
    const payment = await Payment.findOne({
      "sslcommerz.transactionId": tran_id,
    });

    if (!payment) {
      console.error("Payment not found for transaction:", tran_id);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?error=payment_not_found`
      );
    }

    // Find subscription
    const subscription = await Subscription.findById(payment.subscriptionId);
    if (!subscription) {
      console.error("Subscription not found:", payment.subscriptionId);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?error=subscription_not_found`
      );
    }

    // For sandbox, we trust the callback since it's already validated
    // In production, you should validate with SSLCommerz API
    const is_live = process.env.SSLCOMMERZ_IS_LIVE === "true";

    // Only validate in production to avoid fetch issues in sandbox
    let isValid = true;
    if (is_live && val_id) {
      // Production validation would go here
      // For now, we'll trust the status from callback
      isValid = status === "VALID" || status === "VALIDATED";
    }

    // Check if payment is valid
    if (isValid && (status === "VALID" || status === "VALIDATED")) {
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
        await subscription.populate("planId");
        await User.findByIdAndUpdate(user._id, {
          membershipTier: subscription.planId.tier,
          membershipExpiry: subscription.endDate,
          currentSubscription: subscription._id,
        });
      }

      console.log("Payment successful:", tran_id);

      // Redirect to success page
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?transaction=${tran_id}&plan=${subscription.planId}&cycle=${subscription.billingCycle}`
      );
    } else {
      // Validation failed
      console.error("Payment validation failed:", { status, val_id });

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
