import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { verifyToken, hashPassword } from "@/lib/utils/auth";
import { passwordChangeSchema } from "@/lib/validations/auth";
import { handleError, UnauthorizedError } from "@/lib/utils/errorHandler";
import { successResponse } from "@/lib/utils/apiResponse";
import { MESSAGES } from "@/lib/utils/constants";
import { csrfProtection } from "@/lib/utils/csrf";

// PUT - Change user password
export async function POST(request) {
  // CSRF Protection
  const csrfError = csrfProtection(request);
  if (csrfError) {
    return NextResponse.json(
      { success: false, message: csrfError.message },
      { status: csrfError.status }
    );
  }

  try {
    await connectDB();

    const userId = request.headers.get("x-user-id"); // Placeholder - replace with actual auth

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Both current and new password are required",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    // Get user with password
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to change password" },
      { status: 500 }
    );
  }
}
