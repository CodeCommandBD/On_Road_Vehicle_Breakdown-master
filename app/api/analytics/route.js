import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import SOS from "@/lib/db/models/SOS";
import Booking from "@/lib/db/models/Booking";
import Payment from "@/lib/db/models/Payment";
import User from "@/lib/db/models/User";
import Subscription from "@/lib/db/models/Subscription";
import { verifyToken } from "@/lib/utils/auth";
import TeamMember from "@/lib/db/models/TeamMember";
import Organization from "@/lib/db/models/Organization";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectDB();

    // Auth Check
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = new mongoose.Types.ObjectId(user.userId);

    // Check if user is an Organization Owner
    // If so, we want to show analytics for the ENTIRE organization (all members)
    // If not, show only personal analytics

    let targetUserIds = [userId];
    let isOrgView = false;

    const ownedOrg = await Organization.findOne({ owner: userId });

    if (ownedOrg) {
      isOrgView = true;
      // Fetch all team members
      const teamMembers = await TeamMember.find({
        organization: ownedOrg._id,
      }).select("user");

      const memberIds = teamMembers.map((tm) => tm.user);

      // Combine Owner ID + Member IDs
      targetUserIds = [userId, ...memberIds];
    }

    // Date ranges for analytics
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // ============================================
    // 1. BOOKING ANALYTICS
    // ============================================

    // Bookings by month (last 12 months)
    const bookingsByMonth = await Booking.aggregate([
      {
        $match: {
          user: { $in: targetUserIds },
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          totalCost: { $sum: { $ifNull: ["$actualCost", "$estimatedCost"] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Bookings by status
    const bookingsByStatus = await Booking.aggregate([
      { $match: { user: { $in: targetUserIds } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Bookings by service type (populate service name)
    const bookingsByService = await Booking.aggregate([
      { $match: { user: { $in: targetUserIds }, status: "completed" } },
      {
        $lookup: {
          from: "services",
          localField: "service",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },
      {
        $unwind: { path: "$serviceDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$serviceDetails.name",
          count: { $sum: 1 },
          totalCost: { $sum: { $ifNull: ["$actualCost", "$estimatedCost"] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Total bookings count
    const totalBookings = await Booking.countDocuments({
      user: { $in: targetUserIds },
    });

    // ============================================
    // 2. COST ANALYTICS (from Bookings & Payments)
    // ============================================

    // Monthly spending from completed bookings
    const monthlySpending = bookingsByMonth.map((item) => ({
      month: item._id.month,
      year: item._id.year,
      amount: item.totalCost || 0,
    }));

    // Cost distribution by service category
    const costByCategory = bookingsByService.map((item) => ({
      name: item._id || "Unknown Service",
      value: item.totalCost || 0,
      count: item.count,
    }));

    // Total spending calculation
    const totalSpentResult = await Booking.aggregate([
      { $match: { user: { $in: targetUserIds }, status: "completed" } },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$actualCost", "$estimatedCost"] } },
        },
      },
    ]);
    const totalSpent = totalSpentResult[0]?.total || 0;

    // ============================================
    // 3. SOS REQUEST ANALYTICS
    // ============================================

    const sosHistory = await SOS.aggregate([
      {
        $match: {
          user: { $in: targetUserIds },
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const sosRequestsCount = await SOS.countDocuments({
      user: { $in: targetUserIds },
    });

    // SOS by emergency type
    const sosByType = await SOS.aggregate([
      { $match: { user: { $in: targetUserIds } } },
      {
        $group: {
          _id: "$emergencyType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // ============================================
    // 4. SUBSCRIPTION ANALYTICS
    // ============================================

    const activeSubscription = await Subscription.findOne({
      userId: userId,
      status: { $in: ["active", "trial"] },
    }).populate("planId");

    const subscriptionUsage = {
      callsUsed: activeSubscription?.usage?.serviceCallsUsed || 0,
      callsLimit: activeSubscription?.planId?.limits?.serviceCalls || 0,
      daysRemaining: activeSubscription?.daysRemaining || 0,
      tier: activeSubscription?.planId?.tier || "free",
      status: activeSubscription?.status || "none",
    };

    // ============================================
    // 5. VEHICLE HEALTH SCORE
    // ============================================

    // Calculate health score based on:
    // - Recent issues (last 3 months)
    // - Booking frequency
    // - SOS frequency
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentIssues = await Booking.countDocuments({
      user: { $in: targetUserIds },
      createdAt: { $gte: threeMonthsAgo },
      status: { $in: ["completed", "in_progress"] },
    });

    const recentSOS = await SOS.countDocuments({
      user: { $in: targetUserIds },
      createdAt: { $gte: threeMonthsAgo },
    });

    // Health score algorithm (100 is perfect)
    let healthScore = 100;
    healthScore -= recentIssues * 5; // -5 points per recent booking
    healthScore -= recentSOS * 10; // -10 points per SOS (more critical)
    healthScore = Math.max(0, Math.min(100, healthScore)); // Clamp between 0-100

    // ============================================
    // 6. FORMAT DATA FOR FRONTEND
    // ============================================

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Format booking trends for chart
    const usageData = bookingsByMonth.map((item) => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.year
        .toString()
        .slice(-2)}`,
      bookings: item.count,
      cost: item.totalCost || 0,
    }));

    // Format SOS history
    const sosData = sosHistory.map((item) => ({
      name: monthNames[item._id - 1],
      requests: item.count,
    }));

    // Status distribution
    const statusDistribution = bookingsByStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Mock data fallback if no real data exists
    const hasMockData = totalBookings === 0;
    const mockUsageData = [
      { name: "Jul '24", bookings: 2, cost: 3500 },
      { name: "Aug '24", bookings: 1, cost: 1200 },
      { name: "Sep '24", bookings: 3, cost: 5400 },
      { name: "Oct '24", bookings: 0, cost: 0 },
      { name: "Nov '24", bookings: 4, cost: 6800 },
      { name: "Dec '24", bookings: 2, cost: 2500 },
    ];

    const mockCostData = [
      { name: "Towing", value: 4500, count: 3 },
      { name: "Engine Repair", value: 3200, count: 2 },
      { name: "Fuel Delivery", value: 1500, count: 4 },
      { name: "Routine Maintenance", value: 2000, count: 2 },
    ];

    // ============================================
    // 7. RETURN COMPREHENSIVE ANALYTICS
    // ============================================

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalBookings,
          totalSpent,
          sosRequestsCount,
          vehicleHealthScore: Math.round(healthScore),
        },
        bookingStats: {
          byMonth: usageData.length > 0 ? usageData : mockUsageData,
          byStatus: statusDistribution,
          byServiceType:
            costByCategory.length > 0 ? costByCategory : mockCostData,
        },
        costAnalysis: {
          byMonth: monthlySpending,
          byCategory: costByCategory.length > 0 ? costByCategory : mockCostData,
          totalSpent,
        },
        sosHistory: {
          byMonth: sosData,
          byType: sosByType,
          total: sosRequestsCount,
        },
        subscriptionUsage,
        healthScore: Math.round(healthScore),
        lastUpdated: new Date().toISOString(),
        isMockData: hasMockData,
        isOrganizationView: isOrgView,
        memberCount: targetUserIds.length,
      },
    });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
