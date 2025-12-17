import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/utils/auth";
import User from "@/lib/db/models/User";
import Subscription from "@/lib/db/models/Subscription";

export async function GET(request) {
  try {
    await connectDB();

    // Get authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with populated subscription
    const user = await User.findById(currentUser.userId).select(
      "name email membershipTier membershipExpiry currentSubscription"
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // If user has no subscription, return basic info
    if (!user.currentSubscription) {
      return NextResponse.json({
        success: true,
        data: {
          membershipTier: user.membershipTier || "free",
          membershipExpiry: null,
          subscription: null,
        },
      });
    }

    // Get subscription with populated plan details
    const subscription = await Subscription.findById(
      user.currentSubscription
    ).populate("planId");

    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: {
          membershipTier: user.membershipTier || "free",
          membershipExpiry: user.membershipExpiry,
          subscription: null,
        },
      });
    }

    // Check if subscription is expired
    const now = new Date();
    const isExpired =
      subscription.endDate && new Date(subscription.endDate) < now;

    // Return subscription details
    return NextResponse.json({
      success: true,
      data: {
        membershipTier: user.membershipTier,
        membershipExpiry: user.membershipExpiry,
        subscription: {
          _id: subscription._id,
          planId: subscription.planId,
          status: isExpired ? "expired" : subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          billingCycle: subscription.billingCycle,
          amount: subscription.amount,
          autoRenew: subscription.autoRenew || false,
        },
      },
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
