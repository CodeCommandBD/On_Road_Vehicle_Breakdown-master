import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { verifyToken, hashPassword } from "@/lib/utils/auth";
import { errorResponse, successResponse } from "@/lib/utils/apiResponse";
import { strictRateLimit } from "@/lib/utils/rateLimit";

export async function POST(request) {
  // Apply strict rate limiting (5 requests per 15 minutes)
  const rateLimitResponse = strictRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return errorResponse("Token and new password are required", 400);
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return errorResponse("Password must be at least 8 characters long", 400);
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
    if (!passwordRegex.test(newPassword)) {
      return errorResponse(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
        400
      );
    }

    // Verify token
    const payload = await verifyToken(token);

    if (!payload || payload.purpose !== "password-reset") {
      return errorResponse("Invalid or expired reset token", 400);
    }

    // Find user with matching token
    const user = await User.findOne({
      _id: payload.userId,
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() }, // Token not expired
    });

    if (!user) {
      return errorResponse("Invalid or expired reset token", 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    console.log(`✅ Password reset successful for user: ${user.email}`);

    return successResponse(
      null,
      "Password has been reset successfully. You can now login with your new password."
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return errorResponse(
      "An error occurred while resetting your password.",
      500
    );
  }
}
