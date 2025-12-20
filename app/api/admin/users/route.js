import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import PointsRecord from "@/lib/db/models/PointsRecord";
import { verifyToken } from "@/lib/utils/auth";

async function checkAdmin(request) {
  const token = request.cookies.get("token")?.value;
  const decoded = await verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

export async function GET(request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin)
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );

    await connectDB();
    const users = await User.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users: users.map((u) => u.toPublicJSON()),
    });
  } catch (error) {
    console.error("Admin User Fetch Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin)
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );

    await connectDB();
    const { userId, rewardPoints, isActive, role } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Handle points adjustment
    if (rewardPoints !== undefined) {
      const diff = rewardPoints - (user.rewardPoints || 0);
      user.rewardPoints = rewardPoints;

      // Log point change
      if (diff !== 0) {
        await PointsRecord.create({
          user: user._id,
          points: Math.abs(diff),
          type: diff > 0 ? "earn" : "redeem",
          reason: `Admin adjustment: ${
            diff > 0 ? "Added" : "Removed"
          } by administrator`,
          metadata: { adminId: admin.userId },
        });
      }
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role !== undefined) user.role = role;

    await user.save();

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Admin User Update Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
