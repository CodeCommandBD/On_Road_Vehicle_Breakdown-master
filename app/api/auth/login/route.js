import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { createToken, setTokenCookie } from "@/lib/utils/auth";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, role } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user with password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "Your account has been deactivated" },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check role if specified
    if (role && user.role !== role) {
      return NextResponse.json(
        { success: false, message: `This account is not registered as a ${role}` },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create JWT token
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = await createToken(tokenPayload);

    // Set cookie
    await setTokenCookie(token);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: user.toPublicJSON(),
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
