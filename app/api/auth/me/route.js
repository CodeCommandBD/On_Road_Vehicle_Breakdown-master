import { requireAuth, getUserById } from "@/lib/utils/auth";
import { handleError } from "@/lib/utils/errorHandler";
import { successResponse } from "@/lib/utils/apiResponse";
import { connectDB } from "@/lib/db/connect";
import Subscription from "@/lib/db/models/Subscription";
import User from "@/lib/db/models/User";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/me
 * Get current authenticated user details
 */
export async function GET(request) {
  try {
    await connectDB();

    // Require authentication - throws UnauthorizedError if not authenticated
    const currentUser = await requireAuth(request);

    // Fetch full user details from database
    const user = await getUserById(currentUser.userId);

    if (!user) {
      throw new NotFoundError("ব্যবহারকারী খুঁজে পাওয়া যায়নি");
    }

    // --- SUBSCRIPTION VALIDATION & AUTO-DOWNGRADE ---
    // Rule: Paid tiers (and Trial) MUST have a valid active subscription.
    const tiersRequiringSubscription = [
      "trial",
      "standard",
      "premium",
      "enterprise",
      "garage_pro",
    ];
    const isTierRequiringSub = tiersRequiringSubscription.includes(
      user.membershipTier
    );

    // Check if subscription ID exists in User doc
    const subscriptionId = user.currentSubscription;

    let isValidSubscription = false;

    if (subscriptionId) {
      // Verify it exists in DB
      const subscription = await Subscription.findById(subscriptionId);
      if (
        subscription &&
        (subscription.status === "active" || subscription.status === "trial")
      ) {
        isValidSubscription = true;
      }
    }

    // Downgrade if:
    // 1. User is on paid/trial tier BUT has no subscription ID OR subscription is invalid/inactive
    // 2. User has a subscription ID that doesn't exist in DB (orphan reference)
    if (
      (isTierRequiringSub && !isValidSubscription) ||
      (subscriptionId && !isValidSubscription)
    ) {
      console.log(
        `Auto-downgrading user ${user._id} to free tier. Tier: ${user.membershipTier}, SubId: ${subscriptionId}`
      );

      await User.findByIdAndUpdate(user._id, {
        membershipTier: "free",
        currentSubscription: null,
        membershipExpiry: null,
      });

      // Update the user object for response
      user.membershipTier = "free";
      user.currentSubscription = null;
      user.membershipExpiry = null;
    }
    // -----------------------------------------------

    // Return user data
    return successResponse(
      {
        user: user.toPublicJSON(),
      },
      "ব্যবহারকারীর তথ্য সফলভাবে পাওয়া গেছে"
    );
  } catch (error) {
    return handleError(error);
  }
}
