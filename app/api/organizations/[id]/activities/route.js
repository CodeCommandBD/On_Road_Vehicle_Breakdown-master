import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import TeamMember from "@/lib/db/models/TeamMember";
import { verifyToken } from "@/lib/utils/auth";
import { getRecentActivities } from "@/lib/utils/activity";

// GET: Get organization activity logs
export async function GET(req, { params }) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit")) || 50;

    // Check membership
    const membership = await TeamMember.findOne({
      organization: id,
      user: user.userId,
      isActive: true,
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Get activities
    const activities = await getRecentActivities(id, limit);

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Get Activities Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
