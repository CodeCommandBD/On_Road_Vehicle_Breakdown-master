import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";

// Debug endpoint to check user membership
export async function GET(req) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({
        success: false,
        message: "No token found",
        hasToken: false,
      });
    }

    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Invalid token",
        hasToken: true,
        tokenValid: false,
      });
    }

    const userDoc = await User.findById(user.userId);

    if (!userDoc) {
      return NextResponse.json({
        success: false,
        message: "User not found in database",
        userId: user.userId,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: userDoc._id,
        email: userDoc.email,
        name: userDoc.name,
        role: userDoc.role,
        membershipTier: userDoc.membershipTier,
        membershipExpiry: userDoc.membershipExpiry,
        createdAt: userDoc.createdAt,
      },
      message: "User data fetched successfully",
    });
  } catch (error) {
    console.error("Debug membership error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        error: error.toString(),
      },
      { status: 500 }
    );
  }
}
