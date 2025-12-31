import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";

/**
 * POST /api/users/status
 * Update user online status and broadcast to presence channel
 */
export async function POST(request) {
  // Rate limiting: 30 requests per minute
  const rateLimitResult = rateLimitMiddleware(request, 30, 60 * 1000);
  if (rateLimitResult) return rateLimitResult;

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

    const { status } = await request.json();

    // Validate status
    const validStatuses = ["online", "offline", "away"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    // Update user status in database
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      {
        onlineStatus: status,
        lastSeen: new Date(),
      },
      { new: true }
    ).select("name avatar onlineStatus lastSeen");

    // Broadcast status change to presence channel
    await pusherServer.trigger("presence-users", "status-change", {
      userId: decoded.userId,
      status,
      lastSeen: new Date(),
      user: {
        name: user.name,
        avatar: user.avatar,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Status updated",
      user: {
        onlineStatus: user.onlineStatus,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/status
 * Get online status of multiple users
 */
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

    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get("userIds")?.split(",") || [];

    if (userIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "User IDs required" },
        { status: 400 }
      );
    }

    const users = await User.find({
      _id: { $in: userIds },
    }).select("name avatar onlineStatus lastSeen");

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get status error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
