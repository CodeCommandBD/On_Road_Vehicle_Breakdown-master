import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import PointsRecord from "@/lib/db/models/PointsRecord";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";

export async function GET(request) {
  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current points and level
    const user = await User.findById(decoded.userId).select(
      "rewardPoints level"
    );

    // Get transaction history
    const history = await PointsRecord.find({ user: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json({
      success: true,
      rewardPoints: user?.rewardPoints || 0,
      level: user?.level || 1,
      history,
    });
  } catch (error) {
    console.error("Points GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
