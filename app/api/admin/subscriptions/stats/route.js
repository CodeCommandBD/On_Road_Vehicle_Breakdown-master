import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Subscription from "@/lib/db/models/Subscription";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import Payment from "@/lib/db/models/Payment";

export async function GET(request) {
  try {
    await connectDB();

    // Get current date for calculations
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for performance
    const [
      totalUsers,
      totalGarages,
      activeUserSubs,
      activeGarageSubs,
      expiringSoon,
      expiredSubs,
      recentPayments,
      totalRevenue,
      monthlyRevenue,
    ] = await Promise.all([
      // Total counts
      User.countDocuments(),
      Garage.countDocuments(),

      // Active subscriptions
      User.countDocuments({
        membershipTier: { $nin: ["free", null] },
        membershipExpiry: { $gt: now },
      }),
      Garage.countDocuments({
        membershipTier: { $nin: ["free", null] },
        membershipExpiry: { $gt: now },
      }),

      // Expiring soon (within 7 days)
      User.countDocuments({
        membershipExpiry: { $gt: now, $lt: sevenDaysFromNow },
      }),

      // Expired but not updated
      User.countDocuments({
        membershipTier: { $nin: ["free", null] },
        membershipExpiry: { $lt: now },
      }),

      // Recent payments (last 30 days)
      Payment.find({
        createdAt: { $gte: thirtyDaysAgo },
        status: "completed",
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "name email")
        .lean(),

      // Total revenue
      Payment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      // Monthly revenue (last 30 days)
      Payment.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    // Subscription breakdown by tier
    const userTierBreakdown = await User.aggregate([
      { $group: { _id: "$membershipTier", count: { $sum: 1 } } },
    ]);

    const garageTierBreakdown = await Garage.aggregate([
      { $group: { _id: "$membershipTier", count: { $sum: 1 } } },
    ]);

    // Calculate MRR (Monthly Recurring Revenue estimate)
    const activeSubs = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: "$billingCycle",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Estimate MRR
    let mrr = 0;
    activeSubs.forEach((sub) => {
      if (sub._id === "monthly") {
        mrr += sub.total;
      } else if (sub._id === "yearly") {
        mrr += sub.total / 12; // Convert yearly to monthly
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalGarages,
          activeUserSubscriptions: activeUserSubs,
          activeGarageSubscriptions: activeGarageSubs,
          totalActiveSubscriptions: activeUserSubs + activeGarageSubs,
          expiringSoon,
          expired: expiredSubs,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          monthly: monthlyRevenue[0]?.total || 0,
          mrr: Math.round(mrr),
        },
        breakdown: {
          users: userTierBreakdown,
          garages: garageTierBreakdown,
        },
        recentPayments,
      },
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch subscription stats" },
      { status: 500 }
    );
  }
}
