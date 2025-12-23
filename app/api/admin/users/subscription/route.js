import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Subscription from "@/lib/db/models/Subscription";

// GET: Get all users with subscription details
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const tier = searchParams.get("tier");
    const status = searchParams.get("status"); // active, expired, expiring

    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    if (tier && tier !== "all") {
      query.membershipTier = tier;
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (status === "active") {
      query.membershipExpiry = { $gt: now };
      query.membershipTier = { $nin: ["free", null] };
    } else if (status === "expired") {
      query.membershipExpiry = { $lt: now };
      query.membershipTier = { $nin: ["free", null] };
    } else if (status === "expiring") {
      query.membershipExpiry = { $gt: now, $lt: sevenDaysFromNow };
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select(
          "name email phone membershipTier membershipExpiry createdAt currentSubscription"
        )
        .populate({
          path: "currentSubscription",
          populate: {
            path: "planId",
            model: "Package",
            select: "name tier",
          },
        })
        .sort({ membershipExpiry: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get Users Subscription Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// PATCH: Update user subscription
export async function PATCH(request) {
  try {
    await connectDB();

    const { userId, membershipTier, membershipExpiry, action } =
      await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Different actions
    if (action === "upgrade" || action === "downgrade") {
      if (!membershipTier) {
        return NextResponse.json(
          { success: false, message: "Membership tier required" },
          { status: 400 }
        );
      }
      user.membershipTier = membershipTier;
    }

    if (action === "extend" || action === "upgrade" || action === "downgrade") {
      if (!membershipExpiry) {
        return NextResponse.json(
          { success: false, message: "Expiry date required" },
          { status: 400 }
        );
      }
      user.membershipExpiry = new Date(membershipExpiry);
    }

    if (action === "activate") {
      if (!membershipTier || !membershipExpiry) {
        return NextResponse.json(
          {
            success: false,
            message: "Tier and expiry required for activation",
          },
          { status: 400 }
        );
      }
      user.membershipTier = membershipTier;
      user.membershipExpiry = new Date(membershipExpiry);
    }

    if (action === "deactivate") {
      user.membershipTier = "free";
      user.membershipExpiry = new Date();
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: `User subscription ${action}d successfully`,
      data: { user },
    });
  } catch (error) {
    console.error("Update User Subscription Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
