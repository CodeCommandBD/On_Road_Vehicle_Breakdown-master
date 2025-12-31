import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { verifyToken } from "@/lib/utils/auth";
import connectDB from "@/lib/db/connect";
import AnalyticsEvent from "@/lib/db/models/AnalyticsEvent";
import RevenueMetrics from "@/lib/db/models/RevenueMetrics";
import GaragePerformance from "@/lib/db/models/GaragePerformance";
import ConversionFunnel from "@/lib/db/models/ConversionFunnel";

export async function POST(request) {
  try {
    // 1. Security Check
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    // Allow if admin OR if a secret key is provided (for triggering via curl/cron)
    const authHeader = request.headers.get("authorization");
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if ((!decoded || decoded.role !== "admin") && !isCron) {
      return NextResponse.json(
        { success: false, message: "Unauthorized execution" },
        { status: 401 }
      );
    }

    console.log("🚀 Starting System Optimization via API...");
    await connectDB();

    const results = [];

    // 2. Create Indexes
    const models = [
      { model: AnalyticsEvent, name: "AnalyticsEvent" },
      { model: RevenueMetrics, name: "RevenueMetrics" },
      { model: GaragePerformance, name: "GaragePerformance" },
      { model: ConversionFunnel, name: "ConversionFunnel" },
    ];

    for (const { model, name } of models) {
      try {
        // Ensure collection exists (hacky way: count docs)
        // await model.countDocuments();

        // Sync Indexes
        await model.createIndexes();
        results.push(`✅ ${name}: Indexes synced`);
      } catch (err) {
        results.push(`⚠️ ${name}: ${err.message}`);
      }
    }

    // 3. Verify Data
    const eventCount = await AnalyticsEvent.countDocuments();
    results.push(`📊 Total Analytics Events: ${eventCount}`);

    console.log("Optimization Complete:", results);

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("System Optimization Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
