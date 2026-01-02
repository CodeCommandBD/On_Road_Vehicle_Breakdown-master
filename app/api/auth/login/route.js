import { NextResponse } from "next/server";
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
  // Apply strict rate limiting
  const rateLimitResponse = strictRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Dynamic imports to prevent top-level crashes
    const connectDB = (await import("@/lib/db/connect")).default;
    const User = (await import("@/lib/db/models/User")).default;
    const { createToken, setTokenCookie } = await import("@/lib/utils/auth");
    const { loginSchema } = await import("@/lib/validations/auth");

    await connectDB();

    const body = await request.json();

    // Validate request body
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;
    const { role, remember } = body;

    // Find user with password
    const user = await User.findOne({
      $or: [{ email: email }, { phone: email }],
    }).select("+password");

    if (!user) {
      throw new NotFoundError(MESSAGES.EN.ERROR.INVALID_CREDENTIALS);
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
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        throw new ForbiddenError(
          "Account locked due to multiple failed login attempts. Please try again in 15 minutes."
        );
      }
      await user.save();
      const attemptsRemaining = 5 - user.failedLoginAttempts;
      throw new UnauthorizedError(
        `${MESSAGES.EN.ERROR.INVALID_CREDENTIALS} (${attemptsRemaining} attempts remaining)`
      );
    }

    // Check role if specified
    if (role && user.role !== role) {
      throw new UnauthorizedError(
        `This account is registered as '${user.role}'. Please switch to that tab to login.`
      );
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
    let effectiveTier = user.membershipTier || "free";
    try {
      const TeamMember = (await import("@/lib/db/models/TeamMember")).default;
      const Package = (await import("@/lib/db/models/Package")).default;

      // Check if personal subscription has expired and downgrade to free
      const now = new Date();
      if (user.membershipExpiry && new Date(user.membershipExpiry) < now) {
        user.membershipTier = "free";
        user.membershipExpiry = null;
        user.currentSubscription = null;
        await user.save();
      }
      effectiveTier = user.membershipTier || "free";

      // Simple efficient lookup for active memberships
      // We skip complex deep population if possible, or keep it minimal
      const memberships = await TeamMember.find({
        user: user._id,
        isActive: true,
      }).populate({
        path: "organization",
        populate: {
          path: "subscription",
          match: { status: { $in: ["active", "trial"] } },
          populate: { path: "planId", model: "Package" },
        },
      });

      if (memberships?.length > 0) {
        // ... (Simplified logic) ...
        const tierHierarchy = [
          "free",
          "basic",
          "trial",
          "standard",
          "premium",
          "enterprise",
        ];
        const getTierValue = (t) => Math.max(0, tierHierarchy.indexOf(t));
        let maxTierValue = getTierValue(effectiveTier);

        memberships.forEach((member) => {
          const org = member.organization;
          if (org?.subscription?.planId?.tier) {
            const planTier = org.subscription.planId.tier;
            const sub = org.subscription;
            const isActive =
              new Date(sub.startDate) <= new Date() &&
              new Date(sub.endDate) >= new Date();
            if (isActive) {
              const val = getTierValue(planTier);
              if (val > maxTierValue) {
                maxTierValue = val;
                effectiveTier = planTier;
              }
            }
          }
        });
      }
    } catch (tierError) {
      console.error("Membership calculation error:", tierError);
      effectiveTier = user.membershipTier || "free";
    }

    const userPublic = user.toPublicJSON();
    userPublic.membershipTier = effectiveTier;

    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      membershipTier: effectiveTier,
    });

    const cookieMaxAge = remember
      ? 30 * 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;
    await setTokenCookie(token, cookieMaxAge);

    return successResponse(
      { user: userPublic, token },
      MESSAGES.EN.SUCCESS.LOGIN
    );
  } catch (error) {
    return handleError(error);
  }
}
