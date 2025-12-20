import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";

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

    // Get top 10 garages (Heroes)
    const topGarages = await User.find({ role: "garage" })
      .sort({ rewardPoints: -1 })
      .limit(10)
      .select("name avatar rewardPoints level membershipTier");

    // Get top 10 users
    const topUsers = await User.find({ role: "user" })
      .sort({ rewardPoints: -1 })
      .limit(10)
      .select("name avatar rewardPoints level membershipTier");

    return NextResponse.json({
      success: true,
      leaderboards: {
        garages: topGarages,
        users: topUsers,
      },
    });
  } catch (error) {
    console.error("Leaderboard Fetch Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
