import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Payment from "@/lib/db/models/Payment";
import User from "@/lib/db/models/User";
import Booking from "@/lib/db/models/Booking";
import Subscription from "@/lib/db/models/Subscription";

// GET: Get all payments with filters
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const status = searchParams.get("status"); // completed, failed, pending
    const type = searchParams.get("type"); // subscription, service_fee, etc.
    const search = searchParams.get("search"); // transactionId, user name, email
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (type && type !== "all") {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Complex search needs to look up Users first or use aggregation if possible
    // For simplicity in this step, we'll search direct fields first.
    // Ideally we join User, but let's do a basic Transaction ID search first
    if (search) {
      query.$or = [
        { "sslcommerz.transactionId": { $regex: search, $options: "i" } },
        { "invoice.invoiceNumber": { $regex: search, $options: "i" } },
      ];
      // Note: Searching by User Name requires aggregate lookup, adding simple txn search for now
    }

    const [rawPayments, total, stats] = await Promise.all([
      Payment.find(query)
        .populate("userId", "name email avatar") // Fixed path
        .populate("subscriptionId", "name")
        .populate("bookingId", "bookingNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
      Payment.aggregate([
        { $match: query }, // Apply current filter context to stats
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [
                  { $in: ["$type", ["subscription", "service_fee"]] },
                  "$amount",
                  0,
                ],
              },
            },
            totalPayouts: {
              $sum: {
                $cond: [{ $eq: ["$type", "payout"] }, "$amount", 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Transform payments to match frontend expectation (user instead of userId)
    const payments = rawPayments.map((p) => ({
      ...p,
      user: p.userId || { name: "Unknown", email: "N/A" }, // Fallback and alias
    }));

    // Format stats for frontend
    const formattedStats = stats[0]
      ? {
          revenue: stats[0].totalRevenue || 0,
          payouts: stats[0].totalPayouts || 0,
          net: (stats[0].totalRevenue || 0) - (stats[0].totalPayouts || 0),
          count: stats[0].count,
        }
      : { revenue: 0, payouts: 0, net: 0, count: 0 };

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
        stats: formattedStats,
      },
    });
  } catch (error) {
    console.error("Get Payments Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
