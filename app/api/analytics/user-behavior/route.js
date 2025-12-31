import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { verifyToken } from "@/lib/utils/auth";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";
import AnalyticsEvent from "@/lib/db/models/AnalyticsEvent";
import User from "@/lib/db/models/User";

/**
 * GET /api/analytics/user-behavior
 * Get detailed user behavior analytics
 */
export async function GET(request) {
  // Rate limiting
  const rateLimitResult = rateLimitMiddleware(request, 60, 60 * 1000);
  if (rateLimitResult) return rateLimitResult;

  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Retention Analysis (Cohort Analysis)
    const retentionData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          role: "user",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // 2. Feature Usage Stats
    const featureUsage = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          eventType: "feature_usage",
        },
      },
      {
        $group: {
          _id: "$eventName",
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
        },
      },
      {
        $project: {
          feature: "$_id",
          count: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 3. Most Active Users
    const activeUsers = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          userId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$userId",
          eventCount: { $sum: 1 },
          lastActive: { $max: "$timestamp" },
        },
      },
      { $sort: { eventCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $project: {
          userId: "$_id",
          eventCount: 1,
          lastActive: 1,
          name: { $arrayElemAt: ["$userDetails.name", 0] },
          email: { $arrayElemAt: ["$userDetails.email", 0] },
        },
      },
    ]);

    // 4. Session Duration Analysis (Avg time between first and last event in a session)
    const sessionDurations = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          sessionId: { $exists: true },
        },
      },
      {
        $group: {
          _id: "$sessionId",
          startTime: { $min: "$timestamp" },
          endTime: { $max: "$timestamp" },
          eventCount: { $sum: 1 },
        },
      },
      {
        $project: {
          duration: {
            $divide: [{ $subtract: ["$endTime", "$startTime"] }, 1000], // duration in seconds
          },
          eventCount: 1,
        },
      },
      {
        $match: {
          duration: { $gt: 0, $lt: 24 * 3600 }, // Filter outlines (0s or >24h)
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$duration" },
          avgEventsPerSession: { $avg: "$eventCount" },
          totalSessions: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        retention: retentionData,
        featureUsage,
        activeUsers,
        sessionMetrics: sessionDurations[0] || {
          avgDuration: 0,
          avgEventsPerSession: 0,
          totalSessions: 0,
        },
      },
    });
  } catch (error) {
    console.error("User behavior analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
