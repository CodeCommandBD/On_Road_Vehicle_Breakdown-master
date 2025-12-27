import { requireAuth, getUserById } from "@/lib/utils/auth";
import { handleError } from "@/lib/utils/errorHandler";
import { successResponse } from "@/lib/utils/apiResponse";

/**
 * GET /api/auth/me
 * Get current authenticated user details
 */
export async function GET(request) {
  try {
    // Require authentication - throws UnauthorizedError if not authenticated
    const currentUser = await requireAuth(request);

    // Fetch full user details from database
    const user = await getUserById(currentUser.userId);

    if (!user) {
      throw new NotFoundError("ব্যবহারকারী খুঁজে পাওয়া যায়নি");
    }

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
