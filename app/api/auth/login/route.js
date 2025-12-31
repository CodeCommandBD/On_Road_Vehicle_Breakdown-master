import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { createToken, setTokenCookie } from "@/lib/utils/auth";
import { loginSchema } from "@/lib/validations/auth";
import {
  handleError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/utils/errorHandler";
import { successResponse } from "@/lib/utils/apiResponse";
import { MESSAGES } from "@/lib/utils/constants";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate request body using Zod
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;
    const { role } = body; // Optional role check

    console.log("🔍 Login attempt - Email/Phone:", email);
    console.log("🔍 Login attempt - Role filter:", role || "any");

    // Find user with password (support both email and phone)
    const user = await User.findOne({
      $or: [{ email: email }, { phone: email }],
    }).select("+password");

    if (!user) {
      console.log("❌ Login failed - User not found:", email);
      throw new NotFoundError(MESSAGES.ERROR.INVALID_CREDENTIALS);
    }

    console.log(
      "✅ User found - ID:",
      user._id,
      "Role:",
      user.role,
      "Active:",
      user.isActive
    );

    // Check if user is active
    if (!user.isActive) {
      console.log("❌ Login failed - Account inactive");
      throw new ForbiddenError("আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে");
    }

    // Verify password
    console.log("🔍 Verifying password...");
    const isPasswordValid = await user.comparePassword(password);

    console.log("🔍 Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("❌ Login failed - Invalid password");
      throw new UnauthorizedError(MESSAGES.ERROR.INVALID_CREDENTIALS);
    }

    // Check role if specified
    if (role && user.role !== role) {
      console.log(
        "❌ Login failed - Role mismatch. Expected:",
        role,
        "Got:",
        user.role
      );
      throw new UnauthorizedError(`এই অ্যাকাউন্ট ${role} হিসাবে নিবন্ধিত নয়`);
    }

    console.log("✅ Login successful - User:", user.email);

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
    return successResponse(
      {
        user: userPublic,
        token,
      },
      MESSAGES.SUCCESS.LOGIN
    );
  } catch (error) {
    return handleError(error);
  }
}
