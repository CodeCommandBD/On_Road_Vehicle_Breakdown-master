import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import RevenueMetrics from "@/lib/db/models/RevenueMetrics";
import GaragePerformance from "@/lib/db/models/GaragePerformance";
import AnalyticsEvent from "@/lib/db/models/AnalyticsEvent";

// Plan pricing (Monthly in BDT)
const PLAN_PRICING = {
  free: 0,
  trial: 0,
  basic: 999,
  standard: 2499,
  premium: 4999,
  enterprise: 9999,
  garage_basic: 1999,
  garage_pro: 3999,
};

/**
 * Calculate Daily Revenue Metrics (MRR, ARR, Churn)
 */
export async function calculateDailyRevenue() {
  await connectDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Calculate MRR based on active subscriptions
  const users = await User.find({
    "garage.membershipTier": { $in: Object.keys(PLAN_PRICING) },
    isActive: true,
  }).select("garage.membershipTier garage.membershipExpiry");

  let totalMRR = 0;
  const revenueByPlan = {
    standard: 0,
    premium: 0,
    enterprise: 0,
  };

  const customers = {
    total: users.length,
    active: 0,
    new: 0, // Placeholder needs cohort logic
    churned: 0,
  };

  users.forEach((user) => {
    const tier = user.garage?.membershipTier || "free";
    const price = PLAN_PRICING[tier] || 0;

    // Check if subscription is active
    if (
      user.garage?.membershipExpiry &&
      new Date(user.garage.membershipExpiry) > new Date()
    ) {
      totalMRR += price;
      customers.active++;

      if (revenueByPlan[tier] !== undefined) {
        revenueByPlan[tier] += price;
      }
    }
  });

  // 2. Churn Calculation (Users who expired yesterday and didn't renew)
  // Simplified: Count users with expiry < today - 1 day
  // Real implementation needs 'Subscription' history model

  // 3. Create or Update Revenue Metric Entry
  await RevenueMetrics.findOneAndUpdate(
    { date: today, period: "daily" },
    {
      mrr: { total: totalMRR, growth: 0 }, // Growth needs prev day comparison
      arr: { total: totalMRR * 12 },
      arpu: { overall: customers.active > 0 ? totalMRR / customers.active : 0 },
      customers,
      revenueByPlan,
    },
    { upsert: true, new: true }
  );

  return { mrr: totalMRR, activeCustomers: customers.active };
}

/**
 * Calculate Garage Performance Scores
 */
export async function calculateGaragePerformance() {
  await connectDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const garages = await Garage.find({ isActive: true });

  for (const garage of garages) {
    // 1. Calculate Booking Score (30%)
    const completionRate =
      garage.totalBookings > 0
        ? (garage.completedBookings / garage.totalBookings) * 100
        : 0;
    const bookingScore = (completionRate / 100) * 30;

    // 2. Calculate Satisfaction Score (25%)
    // Normalize 5 star rating to 25 points
    const satisfactionScore = (garage.rating.average / 5) * 25;

    // 3. Calculate Response Score (25%)
    // Placeholder: assume random for MVP demonstration if no real booking time data
    const responseScore = 20;

    // 4. Efficiency Score (20%)
    const efficiencyScore = 15;

    const overallScore = Math.round(
      bookingScore + satisfactionScore + responseScore + efficiencyScore
    );

    // Update Garage Model
    // await Garage.findByIdAndUpdate(garage._id, { performanceScore: overallScore });

    // Store history in GaragePerformance
    await GaragePerformance.findOneAndUpdate(
      { garage: garage._id, date: today, period: "daily" },
      {
        performanceScore: {
          overall: overallScore,
          breakdown: {
            bookings: bookingScore,
            satisfaction: satisfactionScore,
          },
        },
        bookings: {
          total: garage.totalBookings,
          completed: garage.completedBookings,
          completionRate,
        },
        satisfaction: {
          rating: garage.rating.average,
        },
        ranking: {
          overall: 0, // Needs sorting logic later
        },
      },
      { upsert: true }
    );
  }
}

/**
 * Main Daily Job
 */
export async function runDailyProcessing() {
  console.log("Starting daily analytics processing...");
  await calculateDailyRevenue();
  await calculateGaragePerformance();

  // BROADCAST UPDATES
  try {
    const { pusherServer } = await import("@/lib/pusher");
    await pusherServer.trigger("analytics", "daily_update", {
      type: "performance_recalc",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to broadcast daily update", err);
  }

  console.log("Daily analytics processing completed.");
  return { success: true };
}
