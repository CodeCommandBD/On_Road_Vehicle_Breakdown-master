import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { verifyToken } from "@/lib/utils/auth";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";
import RevenueMetrics from "@/lib/db/models/RevenueMetrics";
import User from "@/lib/db/models/User";
import Subscription from "@/lib/db/models/Subscription";
import Booking from "@/lib/db/models/Booking";
import Diagnosis from "@/lib/db/models/Diagnosis";

/**
 * GET /api/analytics/revenue
 * Get revenue analytics (admin only)
 */
export async function GET(request) {
  // Rate limiting: 30 requests per minute
  const rateLimitResult = rateLimitMiddleware(request, 30, 60 * 1000);
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
    const period = searchParams.get("period") || "monthly";
    const months = parseInt(searchParams.get("months") || "6");

    // CACHE CHECK
    const cacheKey = `analytics:revenue:${period}:${months}`;
    let cachedData = null;
    let redis = null;

    try {
      const redisModule = await import("@/lib/cache/redis");
      redis = redisModule.default;
      if (redis) {
        cachedData = await redis.get(cacheKey);
        // Handle Upstash returning object vs IORedis returning string
        if (typeof cachedData === "string") {
          cachedData = JSON.parse(cachedData);
        }
      }
    } catch (err) {
      console.warn("Redis cache error:", err);
    }

    if (cachedData) {
      return NextResponse.json({
        success: true,
        cached: true,
        ...cachedData,
      });
    }

    // Get historical metrics
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const metrics = await RevenueMetrics.find({
      period,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    // If no metrics exist, calculate current metrics
    if (metrics.length === 0) {
      const currentMetrics = await calculateCurrentMetrics();
      return NextResponse.json({
        success: true,
        current: currentMetrics,
        historical: [],
        message: "No historical data available. Showing current metrics.",
      });
    }

    // Get latest metrics
    const latest = metrics[0];

    const responseData = {
      current: {
        mrr: latest.mrr,
        arr: latest.arr,
        arpu: latest.arpu,
        ltv: latest.ltv,
        churn: latest.churn,
        customers: latest.customers,
        revenueBySource: latest.revenueBySource,
        revenueByPlan: latest.revenueByPlan,
        forecast: latest.forecast,
      },
      historical: metrics.map((m) => ({
        date: m.date,
        mrr: m.mrr.total,
        arr: m.arr.total,
        arpu: m.arpu.overall,
        churn: m.churn.rate,
        customers: m.customers.total,
      })),
    };

    // CACHE SET
    if (redis) {
      try {
        // Support both Upstash (options obj) and IORedis (args)
        const isUpstash = process.env.UPSTASH_REDIS_REST_URL;
        if (isUpstash) {
          await redis.set(cacheKey, responseData, { ex: 3600 });
        } else {
          await redis.set(cacheKey, JSON.stringify(responseData), "EX", 3600);
        }
      } catch (err) {
        console.error("Failed to set cache:", err);
      }
    }

    return NextResponse.json({
      success: true,
      ...responseData,
    });
  } catch (error) {
    console.error("Revenue analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/revenue
 * Calculate and store revenue metrics (admin only, triggered by cron)
 */
export async function POST(request) {
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

    const metrics = await calculateCurrentMetrics();

    // Store in database
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await RevenueMetrics.findOneAndUpdate(
      { date: today, period: "monthly" },
      metrics,
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Revenue metrics calculated and stored",
      metrics,
    });
  } catch (error) {
    console.error("Calculate revenue error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Calculate current revenue metrics
 */
async function calculateCurrentMetrics() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Get active subscriptions
  const activeSubscriptions = await Subscription.find({
    status: { $in: ["active", "trial"] },
  }).populate("planId");

  // Calculate MRR
  let mrrTotal = 0;
  let mrrNew = 0;
  let revenueByPlan = { standard: 0, premium: 0, enterprise: 0 };

  for (const sub of activeSubscriptions) {
    const monthlyAmount = sub.planId?.price || 0;
    mrrTotal += monthlyAmount;

    // New MRR (subscriptions started this month)
    if (sub.startDate >= firstDayOfMonth) {
      mrrNew += monthlyAmount;
    }

    // Revenue by plan
    const planTier = sub.planId?.tier?.toLowerCase();
    if (revenueByPlan[planTier] !== undefined) {
      revenueByPlan[planTier] += monthlyAmount;
    }
  }

  // Get previous month MRR for growth calculation
  const prevMetrics = await RevenueMetrics.findOne({
    date: lastMonth,
    period: "monthly",
  });

  const prevMrr = prevMetrics?.mrr?.total || mrrTotal;
  const mrrGrowth = prevMrr > 0 ? ((mrrTotal - prevMrr) / prevMrr) * 100 : 0;

  // Calculate ARR
  const arrTotal = mrrTotal * 12;

  // Get total users
  const totalUsers = await User.countDocuments({ isActive: true });
  const paidUsers = activeSubscriptions.length;

  // Calculate ARPU
  const arpuOverall = paidUsers > 0 ? mrrTotal / paidUsers : 0;

  // Calculate ARPU by plan
  const arpuByPlan = {};
  for (const [plan, revenue] of Object.entries(revenueByPlan)) {
    const planUsers = activeSubscriptions.filter(
      (s) => s.planId?.tier?.toLowerCase() === plan
    ).length;
    arpuByPlan[plan] = planUsers > 0 ? revenue / planUsers : 0;
  }

  // Calculate Churn
  const churnedThisMonth = await Subscription.countDocuments({
    status: "cancelled",
    endDate: { $gte: firstDayOfMonth, $lte: now },
  });

  const churnRate = paidUsers > 0 ? (churnedThisMonth / paidUsers) * 100 : 0;

  // Calculate Churned MRR (revenue lost from cancelled subscriptions)
  const churnedSubscriptions = await Subscription.find({
    status: "cancelled",
    endDate: { $gte: firstDayOfMonth, $lte: now },
  }).populate("planId");

  const churnedMrr = churnedSubscriptions.reduce((sum, sub) => {
    return sum + (sub.planId?.price || 0);
  }, 0);

  // Calculate LTV (simplified: ARPU / Churn Rate)
  const avgChurnRate = churnRate > 0 ? churnRate / 100 : 0.05; // Default 5%
  const ltvAverage = arpuOverall / avgChurnRate;

  // Calculate Lost Revenue (churned MRR * average customer lifetime)
  const avgCustomerLifetimeMonths = 12; // Average subscription duration
  const lostRevenue = churnedMrr * avgCustomerLifetimeMonths;

  // Track New Users This Month
  const newUsersCount = await User.countDocuments({
    createdAt: { $gte: firstDayOfMonth, $lte: now },
  });

  // Revenue by source
  const bookingRevenue = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: firstDayOfMonth },
        status: "completed",
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" },
      },
    },
  ]);

  // Calculate AI Diagnose Revenue
  const aiDiagnoses = await Diagnosis.find({
    createdAt: { $gte: firstDayOfMonth },
    isPaid: true,
  });

  const aiDiagnoseRevenue = aiDiagnoses.reduce((sum, diagnosis) => {
    return sum + (diagnosis.pricePaid || 0);
  }, 0);

  // Calculate Subscription Expansion MRR (upgrades)
  const expansions = await Subscription.find({
    updatedAt: { $gte: firstDayOfMonth },
    planHistory: { $exists: true, $ne: [] },
  }).populate("planId previousPlanId");

  let expansionMrr = 0;
  for (const sub of expansions) {
    // Check if there's a plan change this month
    const recentChanges = sub.planHistory.filter(
      (change) =>
        change.changedAt >= firstDayOfMonth && change.changeType === "upgrade"
    );

    if (recentChanges.length > 0) {
      const currentPrice = sub.planId?.price || 0;
      const previousPrice = sub.previousPlanId?.price || 0;
      const priceDiff = currentPrice - previousPrice;
      if (priceDiff > 0) {
        expansionMrr += priceDiff;
      }
    }
  }

  // Calculate Subscription Contraction MRR (downgrades)
  let contractionMrr = 0;
  for (const sub of expansions) {
    // Check for downgrades this month
    const recentDowngrades = sub.planHistory.filter(
      (change) =>
        change.changedAt >= firstDayOfMonth && change.changeType === "downgrade"
    );

    if (recentDowngrades.length > 0) {
      const currentPrice = sub.planId?.price || 0;
      const previousPrice = sub.previousPlanId?.price || 0;
      const priceDiff = previousPrice - currentPrice;
      if (priceDiff > 0) {
        contractionMrr += priceDiff;
      }
    }
  }

  const revenueBySource = {
    subscriptions: mrrTotal,
    bookings: bookingRevenue[0]?.total || 0,
    aiDiagnose: Math.round(aiDiagnoseRevenue), // ✅ Implemented: AI diagnosis revenue tracking
    other: 0,
  };

  // Forecast (simple linear projection)
  const forecastMrr = mrrTotal * (1 + mrrGrowth / 100);
  const forecastArr = forecastMrr * 12;

  return {
    date: now,
    period: "monthly",
    mrr: {
      total: Math.round(mrrTotal),
      new: Math.round(mrrNew),
      expansion: Math.round(expansionMrr), // ✅ Implemented: Revenue from plan upgrades
      contraction: Math.round(contractionMrr), // ✅ Implemented: Revenue lost from plan downgrades
      churn: Math.round(churnedMrr), // ✅ Implemented: Revenue lost from cancelled subscriptions
      growth: Math.round(mrrGrowth * 100) / 100,
    },
    arr: {
      total: Math.round(arrTotal),
      growth: Math.round(mrrGrowth * 100) / 100,
    },
    arpu: {
      overall: Math.round(arpuOverall),
      byPlan: {
        free: 0,
        trial: 0,
        standard: Math.round(arpuByPlan.standard || 0),
        premium: Math.round(arpuByPlan.premium || 0),
        enterprise: Math.round(arpuByPlan.enterprise || 0),
      },
    },
    ltv: {
      average: Math.round(ltvAverage),
      byPlan: {
        standard: Math.round((arpuByPlan.standard || 0) / avgChurnRate),
        premium: Math.round((arpuByPlan.premium || 0) / avgChurnRate),
        enterprise: Math.round((arpuByPlan.enterprise || 0) / avgChurnRate),
      },
    },
    churn: {
      rate: Math.round(churnRate * 100) / 100,
      count: churnedThisMonth,
      revenue: Math.round(lostRevenue), // ✅ Implemented: Estimated total revenue loss from churned customers
    },
    customers: {
      total: totalUsers,
      new: newUsersCount, // ✅ Implemented: New user registrations this month
      active: paidUsers,
      churned: churnedThisMonth,
    },
    revenueBySource,
    revenueByPlan,
    forecast: {
      mrr: Math.round(forecastMrr),
      arr: Math.round(forecastArr),
      customers: Math.round(paidUsers * (1 + mrrGrowth / 100)),
    },
    calculatedAt: new Date(),
  };
}
