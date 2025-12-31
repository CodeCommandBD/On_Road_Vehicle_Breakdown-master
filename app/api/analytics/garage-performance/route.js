import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { verifyToken } from "@/lib/utils/auth";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";
import GaragePerformance from "@/lib/db/models/GaragePerformance";
import Booking from "@/lib/db/models/Booking";
import Review from "@/lib/db/models/Review";
import Garage from "@/lib/db/models/Garage";

/**
 * GET /api/analytics/garage-performance
 * Get garage performance metrics
 */
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get("garageId");
    const period = searchParams.get("period") || "monthly";
    const limit = parseInt(searchParams.get("limit") || "10");

    // If garage owner, only show their garage
    if (
      decoded.role === "garage" &&
      garageId &&
      garageId !== decoded.garageId?.toString()
    ) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // If specific garage requested
    if (garageId) {
      // CACHE CHECK
      const cacheKey = `analytics:garage:${garageId}:${period}`;
      let redis = null;

      try {
        const redisModule = await import("@/lib/cache/redis");
        redis = redisModule.default;
        if (redis) {
          let cached = await redis.get(cacheKey);
          if (typeof cached === "string") cached = JSON.parse(cached);
          if (cached) {
            return NextResponse.json({
              success: true,
              cached: true,
              performance: cached,
            });
          }
        }
      } catch (e) {
        console.warn("Cache error", e);
      }

      const performance = await GaragePerformance.findOne({
        garage: garageId,
        period,
      })
        .sort({ date: -1 })
        .populate("garage", "name address");

      if (!performance) {
        // Calculate on-the-fly if not exists
        const calculated = await calculateGaragePerformance(garageId, period);
        return NextResponse.json({
          success: true,
          performance: calculated,
          message: "Performance calculated on-demand",
        });
      }

      // CACHE SET
      if (redis) {
        try {
          const isUpstash = process.env.UPSTASH_REDIS_REST_URL;
          if (isUpstash)
            await redis.set(cacheKey, performance, { ex: 1800 }); // 30 min
          else
            await redis.set(cacheKey, JSON.stringify(performance), "EX", 1800);
        } catch (e) {}
      }

      return NextResponse.json({
        success: true,
        performance,
      });
    }

    // Get top performing garages (admin only)
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // CACHE CHECK (Top Performers)
    const cacheKey = `analytics:garages:top:${limit}:${period}`;
    try {
      const redisModule = await import("@/lib/cache/redis");
      const redis = redisModule.default;
      if (redis) {
        let cached = await redis.get(cacheKey);
        if (typeof cached === "string") cached = JSON.parse(cached);
        if (cached)
          return NextResponse.json({
            success: true,
            cached: true,
            topPerformers: cached,
            count: cached.length,
          });
      }
    } catch (e) {}

    const topPerformers = await GaragePerformance.find({ period })
      .sort({ "performanceScore.overall": -1, date: -1 })
      .limit(limit)
      .populate("garage", "name address");

    // CACHE SET (Top Performers)
    try {
      const redisModule = await import("@/lib/cache/redis");
      const redis = redisModule.default;
      if (redis) {
        const isUpstash = process.env.UPSTASH_REDIS_REST_URL;
        if (isUpstash) await redis.set(cacheKey, topPerformers, { ex: 3600 });
        else
          await redis.set(cacheKey, JSON.stringify(topPerformers), "EX", 3600);
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      topPerformers,
      count: topPerformers.length,
    });
  } catch (error) {
    console.error("Garage performance error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/garage-performance
 * Calculate and store garage performance (admin/cron only)
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

    const { garageId, period = "monthly" } = await request.json();

    if (garageId) {
      // Calculate for specific garage
      const performance = await calculateGaragePerformance(garageId, period);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await GaragePerformance.findOneAndUpdate(
        { garage: garageId, date: today, period },
        performance,
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        message: "Garage performance calculated",
        performance,
      });
    }

    // Calculate for all garages
    const garages = await Garage.find({ isActive: true });
    const results = [];

    for (const garage of garages) {
      try {
        const performance = await calculateGaragePerformance(
          garage._id.toString(),
          period
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await GaragePerformance.findOneAndUpdate(
          { garage: garage._id, date: today, period },
          performance,
          { upsert: true, new: true }
        );

        results.push({ garageId: garage._id, success: true });
      } catch (error) {
        console.error(`Error calculating for garage ${garage._id}:`, error);
        results.push({
          garageId: garage._id,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Calculated performance for ${
        results.filter((r) => r.success).length
      } garages`,
      results,
    });
  } catch (error) {
    console.error("Calculate garage performance error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Calculate garage performance metrics
 */
async function calculateGaragePerformance(garageId, period = "monthly") {
  const now = new Date();
  let startDate;

  switch (period) {
    case "daily":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "weekly":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "yearly":
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case "monthly":
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Get bookings
  const bookings = await Booking.find({
    garage: garageId,
    createdAt: { $gte: startDate },
  });

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(
    (b) => b.status === "completed"
  ).length;
  const cancelledBookings = bookings.filter(
    (b) => b.status === "cancelled"
  ).length;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;

  const completionRate =
    totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
  const cancellationRate =
    totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

  // Calculate revenue
  const totalRevenue = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const avgPerBooking =
    completedBookings > 0 ? totalRevenue / completedBookings : 0;

  // Get reviews
  const reviews = await Review.find({
    garage: garageId,
    createdAt: { $gte: startDate },
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Calculate performance score (0-100)
  const bookingScore = Math.min((completionRate / 100) * 30, 30); // 30% weight
  const revenueScore = Math.min((totalRevenue / 100000) * 25, 25); // 25% weight (৳1,00,000 = max)
  const satisfactionScore = (avgRating / 5) * 25; // 25% weight
  const efficiencyScore = Math.min((completionRate / 100) * 20, 20); // 20% weight

  const overallScore = Math.round(
    bookingScore + revenueScore + satisfactionScore + efficiencyScore
  );

  // Get all garages for ranking
  const allGarages = await GaragePerformance.find({ period })
    .sort({ "performanceScore.overall": -1 })
    .select("garage performanceScore");

  const ranking =
    allGarages.findIndex((g) => g.garage.toString() === garageId) + 1;

  return {
    garage: garageId,
    date: now,
    period,
    performanceScore: {
      overall: overallScore,
      breakdown: {
        bookings: Math.round(bookingScore),
        revenue: Math.round(revenueScore),
        satisfaction: Math.round(satisfactionScore),
        efficiency: Math.round(efficiencyScore),
      },
    },
    bookings: {
      total: totalBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
      pending: pendingBookings,
      completionRate: Math.round(completionRate * 100) / 100,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      growth: 0, // TODO: Calculate vs previous period
    },
    revenue: {
      total: Math.round(totalRevenue),
      avgPerBooking: Math.round(avgPerBooking),
      growth: 0, // TODO: Calculate vs previous period
      byService: {},
    },
    satisfaction: {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
      responseTime: 0, // TODO: Calculate from messages
      repeatCustomers: 0, // TODO: Calculate
      nps: 0, // TODO: Calculate Net Promoter Score
    },
    efficiency: {
      avgServiceTime: 0, // TODO: Calculate
      onTimeCompletion: completionRate,
      firstTimeFixRate: 0, // TODO: Calculate
      utilizationRate: 0, // TODO: Calculate
    },
    ranking: {
      overall: ranking || 0,
      inCity: 0, // TODO: Calculate city-specific ranking
      inCategory: 0, // TODO: Calculate category ranking
      totalGarages: allGarages.length,
    },
    trends: {
      bookings: "stable",
      revenue: "stable",
      rating: "stable",
      performance: "stable",
    },
    improvements: [],
    competitive: {
      avgIndustry: {
        performanceScore: 70,
        rating: 4.0,
        responseTime: 30,
      },
      position:
        overallScore >= 80
          ? "leader"
          : overallScore >= 70
          ? "above_average"
          : "average",
    },
    calculatedAt: new Date(),
  };
}
