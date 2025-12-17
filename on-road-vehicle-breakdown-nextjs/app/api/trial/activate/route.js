import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getServerSession } from "next-auth";
import Plan from "@/lib/db/models/Plan";
import User from "@/lib/db/models/User";
import Subscription from "@/lib/db/models/Subscription";

export async function POST(request) {
  try {
    await connectDB();

    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user already used trial
    if (user.hasUsedTrial) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already used your free trial",
        },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const activeSubscription = await Subscription.findOne({
      userId: user._id,
      status: { $in: ["active", "trial"] },
    });

    if (activeSubscription) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have an active subscription",
        },
        { status: 400 }
      );
    }

    // Find trial plan
    const trialPlan = await Plan.findOne({ tier: "trial" });
    if (!trialPlan) {
      return NextResponse.json(
        {
          success: false,
          message: "Trial plan not available",
        },
        { status: 404 }
      );
    }

    // Calculate trial dates (7 days)
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create trial subscription
    const subscription = await Subscription.create({
      userId: user._id,
      planId: trialPlan._id,
      status: "trial",
      billingCycle: "monthly",
      startDate,
      endDate,
      amount: 0,
      currency: "BDT",
      paymentMethod: "manual", // Trial doesn't require payment
      autoRenew: false, // Trial doesn't auto-renew
    });

    // Update user
    await User.findByIdAndUpdate(user._id, {
      membershipTier: "trial",
      membershipExpiry: endDate,
      currentSubscription: subscription._id,
      hasUsedTrial: true,
    });

    return NextResponse.json({
      success: true,
      message: "Trial activated successfully",
      data: {
        subscription: {
          id: subscription._id,
          plan: trialPlan.name,
          expiresAt: endDate,
          serviceCallsLimit: trialPlan.limits.serviceCalls,
        },
      },
    });
  } catch (error) {
    console.error("Trial activation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to activate trial",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
