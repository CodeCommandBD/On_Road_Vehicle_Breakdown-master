import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/utils/auth";
import Package from "@/lib/db/models/Package"; // Import Package before dependent models
import Subscription from "@/lib/db/models/Subscription";
import User from "@/lib/db/models/User";

// GET user's subscriptions
export async function GET(request) {
  try {
    await connectDB();

    // Ensure Package model is registered
    console.log("Package model loaded:", Package.modelName);

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find user
    const user = await User.findById(currentUser.userId);
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
