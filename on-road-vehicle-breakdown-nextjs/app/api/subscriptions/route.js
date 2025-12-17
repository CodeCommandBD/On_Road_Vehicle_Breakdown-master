import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getServerSession } from "next-auth";
import Subscription from "@/lib/db/models/Subscription";
import User from "@/lib/db/models/User";

// GET user's subscriptions
export async function GET(request) {
  try {
    await connectDB();

    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get all user subscriptions
    const subscriptions = await Subscription.find({ userId: user._id })
      .populate("planId")
      .sort({ createdAt: -1 });

    // Get current active subscription
    const currentSubscription = subscriptions.find(
      (sub) => sub.status === "active" || sub.status === "trial"
    );

    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        current: currentSubscription || null,
        count: subscriptions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch subscriptions",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
