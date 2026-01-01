import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { verifyToken, hashPassword } from "@/lib/utils/auth";
import { errorResponse, successResponse } from "@/lib/utils/apiResponse";

export async function POST(request) {
  try {
    await connectDB();

    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return errorResponse("Token and new password are required", 400);
    }

    // Validate password length
    if (newPassword.length < 6) {
      return errorResponse("Password must be at least 6 characters long", 400);
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
