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

    // TODO: For production, you must implement the hash validation using the store password
    // const crypto = require('crypto');
    // const store_passwd = process.env.STORE_PASSWD;
    // ... calculate hash ...

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
