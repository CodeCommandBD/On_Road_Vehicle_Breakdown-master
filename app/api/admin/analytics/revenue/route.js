import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Payment from "@/lib/db/models/Payment";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days
    const type = searchParams.get("type"); // user or garage

    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Build query
    let paymentQuery = {
      status: "completed",
      createdAt: { $gte: startDate },
    };

    // Revenue by day
    const revenueByDay = await Payment.aggregate([
      { $match: paymentQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Revenue by plan tier
    const revenueByTier = await Payment.aggregate([
      { $match: paymentQuery },
      {
        $group: {
          _id: "$package.tier",
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // Revenue by billing cycle
    const revenueByBillingCycle = await Payment.aggregate([
      { $match: paymentQuery },
      {
        $group: {
          _id: "$billingCycle",
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Total metrics
    const totalMetrics = await Payment.aggregate([
      { $match: paymentQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
          avgTransactionValue: { $avg: "$amount" },
        },
      },
    ]);

    // Failed payments (for analysis)
    const failedPayments = await Payment.countDocuments({
      status: "failed",
      createdAt: { $gte: startDate },
    });

    // Growth metrics (compare with previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysAgo);

    const previousRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: previousPeriodStart, $lt: startDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const currentRevenue = totalMetrics[0]?.totalRevenue || 0;
    const prevRevenue = previousRevenue[0]?.total || 0;
    const growth =
      prevRevenue > 0
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue: totalMetrics[0]?.totalRevenue || 0,
          totalTransactions: totalMetrics[0]?.totalTransactions || 0,
          avgTransactionValue:
            Math.round(totalMetrics[0]?.avgTransactionValue) || 0,
          failedPayments,
          growth: parseFloat(growth.toFixed(2)),
        },
        revenueByDay,
        revenueByTier,
        revenueByBillingCycle,
      },
    });
  } catch (error) {
    console.error("Revenue Analytics Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch revenue analytics" },
      { status: 500 }
    );
  }
}
