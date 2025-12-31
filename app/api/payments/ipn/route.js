import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Payment from "@/lib/db/models/Payment";
import Subscription from "@/lib/db/models/Subscription";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";

// IPN (Instant Payment Notification) - Server to server validation
export async function POST(request) {
  // Rate limiting: 50 requests per hour (webhooks need higher limit)
  const rateLimitResult = rateLimitMiddleware(request, 50, 60 * 60 * 1000);
  if (rateLimitResult) return rateLimitResult;

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

    // ==================== HASH VALIDATION (SECURITY) ====================
    // SSLCommerz sends verify_sign and verify_key for validation
    // This prevents fraudulent payment notifications
    const verify_sign = data.verify_sign;
    const verify_key = data.verify_key;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;

    // In production mode, hash validation is MANDATORY
    if (process.env.SSLCOMMERZ_MODE === "live") {
      if (!verify_sign || !verify_key) {
        console.error("IPN: Missing verify_sign or verify_key in live mode!");
        return NextResponse.json(
          {
            success: false,
            message: "Missing verification parameters",
          },
          { status: 400 }
        );
      }

      if (!storePassword) {
        console.error("IPN: SSLCOMMERZ_STORE_PASSWORD not configured!");
        return NextResponse.json(
          {
            success: false,
            message: "Server configuration error",
          },
          { status: 500 }
        );
      }

      // Import crypto for hash validation
      const crypto = await import("crypto");

      // SSLCommerz Hash Format: MD5(store_passwd + val_id)
      // Reference: https://developer.sslcommerz.com/doc/v4/#hash-validation
      const verificationString = `${storePassword}${val_id}`;

      // Calculate MD5 hash
      const calculatedHash = crypto
        .createHash("md5")
        .update(verificationString)
        .digest("hex");

      // Compare hashes (case-insensitive)
      if (calculatedHash.toUpperCase() !== verify_sign.toUpperCase()) {
        console.error(
          "🚨 IPN: Hash validation FAILED - Possible fraud attempt!"
        );
        console.error("Transaction ID:", tran_id);
        console.error("Expected Hash:", calculatedHash);
        console.error("Received Hash:", verify_sign);

        // Log this security incident
        try {
          const ActivityLog = (await import("@/lib/db/models/ActivityLog"))
            .default;
          await ActivityLog.create({
            action: "payment_fraud_attempt",
            performedBy: null,
            targetModel: "Payment",
            targetId: value_a,
            changes: {
              tran_id,
              received_hash: verify_sign,
              expected_hash: calculatedHash,
            },
            ipAddress:
              request.headers.get("x-forwarded-for") ||
              request.headers.get("x-real-ip") ||
              "unknown",
            userAgent: request.headers.get("user-agent"),
          });
        } catch (logError) {
          console.error("Failed to log fraud attempt:", logError);
        }

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
      // Sandbox mode - validation is optional but recommended
      if (verify_sign && verify_key && storePassword) {
        const crypto = await import("crypto");
        const verificationString = `${storePassword}${val_id}`;
        const calculatedHash = crypto
          .createHash("md5")
          .update(verificationString)
          .digest("hex");

        if (calculatedHash.toUpperCase() === verify_sign.toUpperCase()) {
          console.log("✅ IPN (Sandbox): Hash validation successful");
        } else {
          console.warn(
            "⚠️ IPN (Sandbox): Hash validation failed but continuing..."
          );
        }
      } else {
        console.warn(
          "⚠️ IPN (Sandbox): Hash validation skipped - verify_sign not provided"
        );
      }
    }
    // ====================================================================

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
