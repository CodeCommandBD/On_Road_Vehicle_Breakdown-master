import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/auth";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Reward from "@/lib/db/models/Reward";
import Redemption from "@/lib/db/models/Redemption";
import PointsRecord from "@/lib/db/models/PointsRecord";
import { nanoid } from "nanoid";

export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const { rewardId } = await request.json();

    // 1. Get Reward & User
    const reward = await Reward.findById(rewardId);
    if (!reward || !reward.isActive) {
      return NextResponse.json(
        { success: false, message: "Reward not available" },
        { status: 404 }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 2. Check Points Balance
    if (user.rewardPoints < reward.pointsCost) {
      return NextResponse.json(
        { success: false, message: "Insufficient points" },
        { status: 400 }
      );
    }

    // 3. Start Transaction (Simulated with sequential ops)
    // Decrement Points
    user.rewardPoints -= reward.pointsCost;
    await user.save();

    // Create Points Record (Negative)
    await PointsRecord.create({
      user: user._id,
      points: -reward.pointsCost,
      type: "redeem",
      reason: `Redeemed: ${reward.title}`,
      metadata: { rewardId: reward._id },
    });

    // Create Redemption
    const couponCode = `REW-${nanoid(8).toUpperCase()}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 day validity default

    const redemption = await Redemption.create({
      user: user._id,
      reward: reward._id,
      pointsSpent: reward.pointsCost,
      code: couponCode,
      status: "active",
      expiresAt: expiryDate,
    });

    return NextResponse.json({
      success: true,
      message: "Reward redeemed successfully!",
      redemption,
      newBalance: user.rewardPoints,
    });
  } catch (error) {
    console.error("Redemption error:", error);
    return NextResponse.json(
      { success: false, message: "Redemption failed" },
      { status: 500 }
    );
  }
}
