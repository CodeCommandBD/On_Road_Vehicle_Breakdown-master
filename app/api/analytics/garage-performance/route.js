import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { verifyToken } from "@/lib/utils/auth";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";
import GaragePerformance from "@/lib/db/models/GaragePerformance";
import Booking from "@/lib/db/models/Booking";
import Review from "@/lib/db/models/Review";
import Garage from "@/lib/db/models/Garage";
import Message from "@/lib/db/models/Message";
import Conversation from "@/lib/db/models/Conversation";

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

  // Calculate Previous Period for Growth Rate
  let prevPeriodStart, prevPeriodEnd;

  switch (period) {
    case "daily":
      prevPeriodStart = new Date(startDate);
      prevPeriodStart.setDate(prevPeriodStart.getDate() - 1);
      prevPeriodEnd = new Date(startDate);
      break;
    case "weekly":
      prevPeriodStart = new Date(startDate);
      prevPeriodStart.setDate(prevPeriodStart.getDate() - 7);
      prevPeriodEnd = new Date(startDate);
      break;
    case "yearly":
      prevPeriodStart = new Date(startDate);
      prevPeriodStart.setFullYear(prevPeriodStart.getFullYear() - 1);
      prevPeriodEnd = new Date(startDate);
      break;
    case "monthly":
    default:
      prevPeriodStart = new Date(startDate);
      prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 1);
      prevPeriodEnd = new Date(startDate);
  }

  // Get Previous Period Bookings
  const prevBookings = await Booking.find({
    garage: garageId,
    createdAt: { $gte: prevPeriodStart, $lt: prevPeriodEnd },
  });

  const prevTotalBookings = prevBookings.length;

  // Calculate Booking Growth Rate
  const bookingGrowth =
    prevTotalBookings > 0
      ? ((totalBookings - prevTotalBookings) / prevTotalBookings) * 100
      : totalBookings > 0
      ? 100
      : 0;

  // Get Previous Period Revenue
  const prevRevenue = prevBookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Calculate Revenue Growth Rate
  const revenueGrowth =
    prevRevenue > 0
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
      : totalRevenue > 0
      ? 100
      : 0;

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
      growth: Math.round(bookingGrowth * 100) / 100, // ✅ Implemented: Booking growth vs previous period
    },
    revenue: {
      total: Math.round(totalRevenue),
      avgPerBooking: Math.round(avgPerBooking),
      growth: Math.round(revenueGrowth * 100) / 100, // ✅ Implemented: Revenue growth vs previous period
      byService: {},
    },
    satisfaction: {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
      responseTime: await calculateResponseTime(garageId, startDate), // ✅ Implemented: Average response time in minutes
      repeatCustomers: await calculateRepeatCustomers(garageId), // ✅ Implemented: Customers with multiple bookings
      nps: calculateNPS(reviews), // ✅ Implemented: Net Promoter Score
    },
    efficiency: {
      avgServiceTime: await calculateAvgServiceTime(bookings), // ✅ Implemented: Average service duration in hours
      onTimeCompletion: completionRate,
      firstTimeFixRate: await calculateFirstTimeFixRate(garageId, startDate), // ✅ Implemented: % of services fixed on first attempt
      utilizationRate: await calculateUtilizationRate(garageId, bookings), // ✅ Implemented: Team capacity utilization %
    },
    ranking: {
      overall: ranking || 0,
      inCity: await calculateCityRanking(garageId, period, overallScore), // ✅ Implemented: Ranking within same city
      inCategory: await calculateCategoryRanking(
        garageId,
        period,
        overallScore
      ), // ✅ Implemented: Ranking within same category
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

/**
 * Calculate average response time for garage
 * @param {string} garageId - Garage ID
 * @param {Date} startDate - Start date for period
 * @returns {Promise<number>} Average response time in minutes
 */
async function calculateResponseTime(garageId, startDate) {
  try {
    // Get garage owner/team members to identify garage messages
    const garage = await Garage.findById(garageId).select("owner");
    if (!garage) return 0;

    // Get conversations involving this garage
    const conversations = await Conversation.find({
      participants: garage.owner,
      createdAt: { $gte: startDate },
    });

    if (conversations.length === 0) return 0;

    let totalResponseTime = 0;
    let responseCount = 0;

    // For each conversation, calculate first response time
    for (const conv of conversations) {
      // Get first 10 messages to find initial exchange
      const messages = await Message.find({
        conversation: conv._id,
      })
        .sort({ createdAt: 1 })
        .limit(10);

      if (messages.length < 2) continue;

      // Find first customer message and first garage response
      const customerMsg = messages.find(
        (m) => m.sender.toString() !== garage.owner.toString()
      );
      const garageMsg = messages.find(
        (m) => m.sender.toString() === garage.owner.toString()
      );

      if (
        customerMsg &&
        garageMsg &&
        garageMsg.createdAt > customerMsg.createdAt
      ) {
        const responseTime = garageMsg.createdAt - customerMsg.createdAt;
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    // Return average in minutes
    const avgResponseTime =
      responseCount > 0
        ? Math.round(totalResponseTime / responseCount / 1000 / 60)
        : 0;

    return avgResponseTime;
  } catch (error) {
    console.error("Error calculating response time:", error);
    return 0;
  }
}

/**
 * Calculate number of repeat customers
 * @param {string} garageId - Garage ID
 * @returns {Promise<number>} Number of repeat customers
 */
async function calculateRepeatCustomers(garageId) {
  try {
    // Find users with multiple completed bookings at this garage
    const repeatCustomers = await Booking.aggregate([
      {
        $match: {
          garage: garageId,
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$user",
          bookingCount: { $sum: 1 },
        },
      },
      {
        $match: {
          bookingCount: { $gt: 1 }, // More than 1 booking = repeat customer
        },
      },
      {
        $count: "total",
      },
    ]);

    return repeatCustomers[0]?.total || 0;
  } catch (error) {
    console.error("Error calculating repeat customers:", error);
    return 0;
  }
}

/**
 * Calculate Net Promoter Score (NPS) from reviews
 * @param {Array} reviews - Array of review objects with rating field
 * @returns {number} NPS score (-100 to +100)
 */
function calculateNPS(reviews) {
  if (!reviews || reviews.length === 0) return 0;

  // Convert 5-star ratings to NPS categories:
  // 5 stars = Promoter (would recommend)
  // 4 stars = Passive (neutral)
  // 1-3 stars = Detractor (would not recommend)

  const promoters = reviews.filter((r) => r.rating === 5).length;
  const passives = reviews.filter((r) => r.rating === 4).length;
  const detractors = reviews.filter((r) => r.rating <= 3).length;

  const totalResponses = reviews.length;

  // NPS = (% Promoters - % Detractors)
  const npsScore =
    totalResponses > 0
      ? Math.round(((promoters - detractors) / totalResponses) * 100)
      : 0;

  return npsScore;
}

/**
 * Calculate average service time from OTP timestamps
 * @param {Array} bookings - Array of booking objects
 * @returns {Promise<number>} Average service time in hours
 */
async function calculateAvgServiceTime(bookings) {
  try {
    // Filter bookings with both start and completion OTP verified
    const completedWithOTP = bookings.filter(
      (b) =>
        b.status === "completed" &&
        b.startOTP?.verifiedAt &&
        b.completionOTP?.verifiedAt
    );

    if (completedWithOTP.length === 0) return 0;

    // Calculate service time for each booking
    let totalServiceTime = 0;
    for (const booking of completedWithOTP) {
      const serviceTime =
        booking.completionOTP.verifiedAt - booking.startOTP.verifiedAt;
      totalServiceTime += serviceTime;
    }

    // Return average in hours (rounded to 1 decimal)
    const avgServiceTime =
      totalServiceTime / completedWithOTP.length / 1000 / 60 / 60;
    return Math.round(avgServiceTime * 10) / 10;
  } catch (error) {
    console.error("Error calculating avg service time:", error);
    return 0;
  }
}

/**
 * Calculate first-time fix rate
 * Percentage of services where customer didn't return within 7 days
 * @param {string} garageId - Garage ID
 * @param {Date} startDate - Start date for period
 * @returns {Promise<number>} First-time fix rate percentage
 */
async function calculateFirstTimeFixRate(garageId, startDate) {
  try {
    // Get all completed bookings in this period
    const completedBookings = await Booking.find({
      garage: garageId,
      status: "completed",
      createdAt: { $gte: startDate },
    }).select("user completedAt");

    if (completedBookings.length === 0) return 0;

    let firstTimeFixes = 0;

    // Check each booking for return visits
    for (const booking of completedBookings) {
      const completedDate = booking.completedAt || booking.updatedAt;
      const sevenDaysLater = new Date(completedDate);
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

      // Check if same user returned within 7 days
      const returnVisit = await Booking.findOne({
        garage: garageId,
        user: booking.user,
        createdAt: {
          $gt: completedDate,
          $lte: sevenDaysLater,
        },
      });

      // If no return visit, it's a first-time fix
      if (!returnVisit) {
        firstTimeFixes++;
      }
    }

    // Calculate percentage
    const ftfRate = (firstTimeFixes / completedBookings.length) * 100;
    return Math.round(ftfRate * 100) / 100;
  } catch (error) {
    console.error("Error calculating first-time fix rate:", error);
    return 0;
  }
}

/**
 * Calculate team utilization rate
 * Percentage of available hours actually used for service
 * @param {string} garageId - Garage ID
 * @param {Array} bookings - Array of booking objects
 * @returns {Promise<number>} Utilization rate percentage
 */
async function calculateUtilizationRate(garageId, bookings) {
  try {
    // Get garage to find team size
    const garage = await Garage.findById(garageId).select("teamMembers");
    if (!garage) return 0;

    // Assume team size (if teamMembers field exists, use it; otherwise estimate)
    const teamSize = garage.teamMembers?.length || 3; // Default 3 mechanics

    // Calculate available hours
    // Assumptions: 8 hours/day, 26 working days/month
    const workingDaysPerMonth = 26;
    const hoursPerDay = 8;
    const totalAvailableHours = teamSize * hoursPerDay * workingDaysPerMonth;

    // Calculate actual hours worked from service times
    const completedWithOTP = bookings.filter(
      (b) =>
        b.status === "completed" &&
        b.startOTP?.verifiedAt &&
        b.completionOTP?.verifiedAt
    );

    if (completedWithOTP.length === 0) return 0;

    let totalWorkedHours = 0;
    for (const booking of completedWithOTP) {
      const serviceTime =
        booking.completionOTP.verifiedAt - booking.startOTP.verifiedAt;
      const hours = serviceTime / 1000 / 60 / 60;
      totalWorkedHours += hours;
    }

    // Calculate utilization rate
    const utilizationRate = (totalWorkedHours / totalAvailableHours) * 100;
    return Math.round(utilizationRate * 100) / 100;
  } catch (error) {
    console.error("Error calculating utilization rate:", error);
    return 0;
  }
}

/**
 * Calculate city-specific ranking
 * Ranks garage among all garages in the same city
 * @param {string} garageId - Garage ID
 * @param {string} period - Time period
 * @param {number} overallScore - This garage's performance score
 * @returns {Promise<number>} Ranking position in city
 */
async function calculateCityRanking(garageId, period, overallScore) {
  try {
    // Get this garage's city
    const garage = await Garage.findById(garageId).select("location.city");
    if (!garage || !garage.location?.city) return 0;

    const city = garage.location.city;

    // Get all garages in the same city
    const cityGarages = await Garage.find({
      "location.city": city,
    }).select("_id");

    if (cityGarages.length === 0) return 0;

    const cityGarageIds = cityGarages.map((g) => g._id.toString());

    // Get performance metrics for all garages in this city
    const cityPerformances = await GaragePerformance.find({
      garage: { $in: cityGarageIds },
      period,
    })
      .sort({ "performanceScore.overall": -1 })
      .select("garage performanceScore");

    // Find this garage's position
    const position = cityPerformances.findIndex(
      (p) => p.garage.toString() === garageId
    );

    return position >= 0 ? position + 1 : 0;
  } catch (error) {
    console.error("Error calculating city ranking:", error);
    return 0;
  }
}

/**
 * Calculate category-specific ranking
 * Ranks garage among garages with similar specializations
 * @param {string} garageId - Garage ID
 * @param {string} period - Time period
 * @param {number} overallScore - This garage's performance score
 * @returns {Promise<number>} Ranking position in category
 */
async function calculateCategoryRanking(garageId, period, overallScore) {
  try {
    // Get this garage's specializations
    const garage = await Garage.findById(garageId).select("specializations");
    if (
      !garage ||
      !garage.specializations ||
      garage.specializations.length === 0
    ) {
      return 0;
    }

    // Get all garages with at least one matching specialization
    const categoryGarages = await Garage.find({
      specializations: { $in: garage.specializations },
    }).select("_id");

    if (categoryGarages.length === 0) return 0;

    const categoryGarageIds = categoryGarages.map((g) => g._id.toString());

    // Get performance metrics for all garages in this category
    const categoryPerformances = await GaragePerformance.find({
      garage: { $in: categoryGarageIds },
      period,
    })
      .sort({ "performanceScore.overall": -1 })
      .select("garage performanceScore");

    // Find this garage's position
    const position = categoryPerformances.findIndex(
      (p) => p.garage.toString() === garageId
    );

    return position >= 0 ? position + 1 : 0;
  } catch (error) {
    console.error("Error calculating category ranking:", error);
    return 0;
  }
}
