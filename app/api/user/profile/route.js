import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { getServerSession } from "next-auth/next";

// GET - Fetch user profile
export async function GET(request) {
  try {
    await dbConnect();

    // Get user session (you'll need to implement auth checking)
    const userId = request.headers.get("x-user-id"); // Placeholder - replace with actual auth

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    await dbConnect();

    const userId = request.headers.get("x-user-id"); // Placeholder - replace with actual auth

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, address } = body;

    // Validate input
    if (name && name.length > 100) {
      return NextResponse.json(
        { success: false, message: "Name cannot exceed 100 characters" },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name: name || undefined,
          phone: phone || undefined,
          address: address || undefined,
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser.toPublicJSON(),
    });
  } catch (error) {
    console.error("Profile update error:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
