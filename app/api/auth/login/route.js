import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { createToken, setTokenCookie } from "@/lib/utils/auth";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, role } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user with password
    const user = await User.findOne({
      $or: [{ email: email }, { phone: email }],
    }).select("+password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "Your account has been deactivated" },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check role if specified
    if (role && user.role !== role) {
      return NextResponse.json(
        {
          success: false,
          message: `This account is not registered as a ${role}`,
        },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // --- EFFECTIVE MEMBERSHIP TIER CALCULATION ---
    // User might be a member of a Premium/Enterprise organization.
    // We should give them access to features based on the highest tier they have access to.

    // Import needed models dynamically to avoid circular deps if any
    const TeamMember = (await import("@/lib/db/models/TeamMember")).default;
    const Organization = (await import("@/lib/db/models/Organization")).default;
    const Subscription = (await import("@/lib/db/models/Subscription")).default;
    const Plan = (await import("@/lib/db/models/Plan")).default;

    let effectiveTier = user.membershipTier || "free";

    // Fetch active memberships
    const memberships = await TeamMember.find({
      user: user._id,
      isActive: true,
    }).populate({
      path: "organization",
      populate: {
        path: "subscription",
        match: { status: { $in: ["active", "trial"] } }, // Only active/trial subs
        populate: {
          path: "planId",
          model: "Plan",
        },
      },
    });

    if (memberships && memberships.length > 0) {
      const tierHierarchy = [
        "free",
        "basic",
        "trial",
        "standard",
        "premium",
        "enterprise",
      ];

      const getTierValue = (tier) => {
        const index = tierHierarchy.indexOf(tier);
        return index === -1 ? 0 : index;
      };

      let maxTierValue = getTierValue(effectiveTier);

      memberships.forEach((member) => {
        const org = member.organization;
        if (org && org.subscription && org.subscription.planId) {
          const planTier = org.subscription.planId.tier;
          // Check if subscription is strictly valid by date (re-verify)
          const now = new Date();
          const sub = org.subscription;
          const isActive =
            new Date(sub.startDate) <= now && new Date(sub.endDate) >= now;

          if (isActive) {
            const planValue = getTierValue(planTier);
            if (planValue > maxTierValue) {
              maxTierValue = planValue;
              effectiveTier = planTier;
            }
          }
        }
      });
    }

    // Override the user object for the response (don't save to DB to keep personal record clean)
    const userPublic = user.toPublicJSON();
    userPublic.membershipTier = effectiveTier;

    // Create JWT token with effective tier
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      membershipTier: effectiveTier, // Add this to token for easier access if needed
    };
    const token = await createToken(tokenPayload);

    // Set cookie
    await setTokenCookie(token);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: userPublic,
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
