import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { createToken } from "@/lib/utils/auth";
import { sendPasswordResetEmail } from "@/lib/utils/passwordResetEmail";
import { errorResponse, successResponse } from "@/lib/utils/apiResponse";
import { MESSAGES } from "@/lib/utils/constants";

export async function POST(request) {
  try {
    await connectDB();

    const { email, role } = await request.json();

    if (!email) {
      return errorResponse("Email is required", 400);
    }

    // Find user by email and role (if specified)
    const query = { email };
    if (role) {
      query.role = role;
    }

    const user = await User.findOne(query);

    if (!user) {
      // For security, don't reveal if user exists or not
      return successResponse(
        null,
        "If an account with that email exists, a password reset link has been sent."
      );
    }

    // Generate reset token (JWT with 1 hour expiry)
    const resetToken = await createToken({
      userId: user._id.toString(),
      email: user.email,
      purpose: "password-reset",
    });

    // Set token expiry (1 hour from now)
    const expiryTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to database
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = expiryTime;
    await user.save();

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(
      user.email,
      resetToken,
      user.name
    );

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
      return errorResponse(
        "Failed to send password reset email. Please try again later.",
        500
      );
    }

    console.log(`✅ Password reset email sent to ${user.email}`);

    // Return success (don't reveal if user exists)
    return successResponse(
      null,
      "If an account with that email exists, a password reset link has been sent."
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return errorResponse(
      "An error occurred while processing your request.",
      500
    );
  }
}
