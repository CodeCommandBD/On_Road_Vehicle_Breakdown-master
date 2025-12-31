import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Payment from "@/lib/db/models/Payment";
import Subscription from "@/lib/db/models/Subscription";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";

// IPN (Instant Payment Notification) - Server to server validation
export async function POST(request) {
  try {
    await connectDB();

    // Get IPN data
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const {
      tran_id,
      val_id,
      status,
      value_a, // payment ID
      value_b, // subscription ID
    } = data;

    console.log("IPN received:", { tran_id, status, val_id });

    // Validate IPN data
    if (!status || !tran_id) {
      console.error("IPN: Invalid data received");
      return NextResponse.json(
        { success: false, message: "Invalid data" },
        { status: 400 }
      );
    }

    // Hash Validation for Security (Prevents Payment Fraud)
    // SSLCommerz sends a verify_sign which is MD5 hash of specific parameters
    const verify_sign = data.verify_sign;
    const verify_key = data.verify_key;

    if (verify_sign && verify_key) {
      // Import crypto for hash validation
      const crypto = await import("crypto");
      const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;

      // Create verification string as per SSLCommerz documentation
      // Format: store_passwd + tran_id + amount + currency
      const verificationString = `${storePassword}${tran_id}${data.amount}${data.currency_type}${status}`;

      // Calculate MD5 hash
      const calculatedHash = crypto
        .createHash("md5")
        .update(verificationString)
        .digest("hex");

      // Compare hashes
      if (calculatedHash.toUpperCase() !== verify_sign.toUpperCase()) {
        console.error("IPN: Hash validation failed - Possible fraud attempt!");
        console.error("Expected:", calculatedHash);
        console.error("Received:", verify_sign);

        return NextResponse.json(
          {
            success: false,
            message: "Hash validation failed",
          },
          { status: 403 }
        );
      }

      console.log("✅ IPN: Hash validation successful");
    } else {
      console.warn(
        "⚠️ IPN: No verify_sign found - Hash validation skipped (sandbox mode)"
      );
    }

    // Find payment
    const payment = await Payment.findById(value_a);
    if (!payment) {
      console.error("IPN: Payment not found");
      return NextResponse.json({ success: false }, { status: 404 });
    }

    // Find subscription
    const subscription = await Subscription.findById(value_b);
    if (!subscription) {
      console.error("IPN: Subscription not found");
      return NextResponse.json({ success: false }, { status: 404 });
    }

    // Process based on status
    if (status === "VALID" || status === "VALIDATED") {
      // Payment successful
      await Payment.findByIdAndUpdate(payment._id, {
        status: "success",
        paidAt: new Date(),
      });

      await Subscription.findByIdAndUpdate(subscription._id, {
        status: "active",
      });

      // Update user
      const user = await User.findById(subscription.userId);
      if (user) {
        const plan = await subscription.populate("planId");
        await User.findByIdAndUpdate(user._id, {
          membershipTier: plan.planId.tier,
          membershipExpiry: subscription.endDate,
          currentSubscription: subscription._id,
        });
      }

      console.log("IPN: Payment validated successfully");

      // Upgrade Garage Membership (Top Listing Benefit)
      if (
        plan.planId.tier === "premium" ||
        plan.planId.tier === "standard" ||
        plan.planId.isFeatured
      ) {
        await Garage.updateMany(
          { owner: subscription.userId },
          {
            $set: {
              isFeatured: true, // Auto-Feature for Top Listing
              membershipTier: plan.planId.tier,
            },
          }
        );
        console.log(
          "IPN: Upgraded garage membership for user:",
          subscription.userId
        );
      }
    } else if (status === "FAILED") {
      // Payment failed
      await Payment.findByIdAndUpdate(payment._id, {
        status: "failed",
      });

      await Subscription.findByIdAndUpdate(subscription._id, {
        status: "cancelled",
      });

      console.log("IPN: Payment failed");
    } else if (status === "CANCELLED") {
      // Payment cancelled
      await Payment.findByIdAndUpdate(payment._id, {
        status: "cancelled",
      });

      await Subscription.findByIdAndUpdate(subscription._id, {
        status: "cancelled",
      });

      console.log("IPN: Payment cancelled");
    }

    // Return 200 OK to SSLCommerz
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("IPN error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
