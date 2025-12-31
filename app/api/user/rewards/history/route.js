import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/auth";
import connectDB from "@/lib/db/connect";
import PointsRecord from "@/lib/db/models/PointsRecord";
import Redemption from "@/lib/db/models/Redemption";

export async function GET(request) {
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
    const userId = decoded.userId;

    // 1. Get Points History through PointsRecord
    const history = await PointsRecord.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20); // Last 20 transactions

    // 2. Get Active Redemptions (Coupons)
    const redemptions = await Redemption.find({
      user: userId,
      status: "active",
    })
      .sort({ createdAt: -1 })
      .populate("reward");

    return NextResponse.json({
      success: true,
      history,
      redemptions,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
