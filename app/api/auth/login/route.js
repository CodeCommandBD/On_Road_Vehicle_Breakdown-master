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
import { strictRateLimit } from "@/lib/utils/rateLimit";

export async function POST(request) {
  // Apply strict rate limiting (5 requests per 15 minutes)
  const rateLimitResponse = strictRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const body = await request.json();

    // Validate request body using Zod
    const validatedData = loginSchema.parse(body);
    const { email, password, remember } = validatedData;
    const { role } = body; // Optional role check

    // Find user with password (support both email and phone)
    const user = await User.findOne({
      $or: [{ email: email }, { phone: email }],
    }).select("+password");

    if (!user) {
      throw new NotFoundError(MESSAGES.ERROR.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ForbiddenError("Your account has been deactivated");
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const lockTimeRemaining = Math.ceil(
        (user.accountLockedUntil - new Date()) / 1000 / 60
      );
      throw new ForbiddenError(
        `Account temporarily locked due to multiple failed login attempts. Please try again in ${lockTimeRemaining} minutes.`
      );
    }

    // Reset lockout if time has passed
    if (user.accountLockedUntil && user.accountLockedUntil <= new Date()) {
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = null;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;

      // Lock account if 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();
        throw new ForbiddenError(
          "Account locked due to multiple failed login attempts. Please try again in 15 minutes."
        );
      }

      await user.save();
      const attemptsRemaining = 5 - user.failedLoginAttempts;

      throw new UnauthorizedError(
        `${MESSAGES.ERROR.INVALID_CREDENTIALS} (${attemptsRemaining} attempts remaining)`
      );
    }

    // Check role if specified
    if (role && user.role !== role) {
      throw new UnauthorizedError(`This account is not registered as ${role}`);
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0 || user.accountLockedUntil) {
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = null;
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

    // Set cookie with appropriate expiry based on "Remember Me"
    const cookieMaxAge = remember
      ? 30 * 24 * 60 * 60 * 1000 // 30 days if remember me is checked
      : 7 * 24 * 60 * 60 * 1000; // 7 days default
    await setTokenCookie(token, cookieMaxAge);

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
