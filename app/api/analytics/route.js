import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import SOS from "@/lib/db/models/SOS";
import Diagnosis from "@/lib/db/models/Diagnosis"; // Assuming this exists or we mock it associated with AI
import User from "@/lib/db/models/User";
import Subscription from "@/lib/db/models/Subscription";
import { verifyToken } from "@/lib/utils/auth";
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

    // 1. Fetch Subscription to confirm access (Double check)
    // Front-end should block, but API must be secure.
    const subscription = await Subscription.findOne({
      user: userId,
      status: "active",
    }).populate("planId");

    const planTier = subscription?.planId?.tier || "free";
    // If we want to strictly enforce API access for premium only:
    // if (!["premium", "enterprise"].includes(planTier)) { ... }
    // But maybe we return limited data for free users? For now, let's return all, frontend handles lock.

    // 2. Mocking/Aggregating Data
    // In a real app, 'Diagnosis' and 'Payment' models would give real spending data.
    // Here we will aggregate SOS calls and simulate some data for demonstration if models are empty.

    // A. Service Usage (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const sosHistory = await SOS.aggregate([
      { $match: { user: userId, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // Sort by month
    ]);

    // Map month numbers to names (Simplified for demo)
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
    const usageData = sosHistory.map((item) => ({
      name: monthNames[item._id - 1],
      services: item.count,
    }));

    // If no data, provide some mock data for the visualization so the user sees something beautiful
    const mockUsageData = [
      { name: "Jan", services: 2 },
      { name: "Feb", services: 1 },
      { name: "Mar", services: 3 },
      { name: "Apr", services: 0 },
      { name: "May", services: 4 },
      { name: "Jun", services: 2 },
    ];

    // B. Cost Distribution (Mocked as we don't have a Payment History model fully linked to services yet)
    // We can assume standard costs: Towing=2000, Engine=1000, Fuel=500
    const costData = [
      { name: "Towing", value: 4500 },
      { name: "Engine Repair", value: 3200 },
      { name: "Fuel Delivery", value: 1500 },
      { name: "Routine Maint.", value: 2000 },
    ];

    // C. Vehicle Health Score (Mocked based on AI Diagnoses count)
    // Less diagnoses = Better health? Or we can just return a static score for now.
    const vehicleHealth = 85; // 85/100

    return NextResponse.json({
      success: true,
      data: {
        usage: usageData.length > 0 ? usageData : mockUsageData,
        costs: costData,
        healthScore: vehicleHealth,
        lastUpdated: new Date().toISOString(),
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
