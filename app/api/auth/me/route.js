import { requireAuth, getUserById } from "@/lib/utils/auth";
import { handleError } from "@/lib/utils/errorHandler";
import { successResponse } from "@/lib/utils/apiResponse";
import { connectDB } from "@/lib/db/connect";
import Subscription from "@/lib/db/models/Subscription";
import User from "@/lib/db/models/User";

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
    // If user has a currentSubscription ID, verify it still exists in DB
    if (user.currentSubscription) {
      const subscription = await Subscription.findById(
        user.currentSubscription
      );

      // If subscription was deleted from DB, auto-downgrade to free
      if (!subscription) {
        console.log(
          `Auto-downgrading user ${user._id} to free tier (subscription deleted)`
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
