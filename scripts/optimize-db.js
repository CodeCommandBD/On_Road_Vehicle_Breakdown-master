import mongoose from "mongoose";
import connectDB from "@/lib/db/connect";
import AnalyticsEvent from "@/lib/db/models/AnalyticsEvent";
import RevenueMetrics from "@/lib/db/models/RevenueMetrics";
import GaragePerformance from "@/lib/db/models/GaragePerformance";
import ConversionFunnel from "@/lib/db/models/ConversionFunnel";

async function optimizeDatabase() {
  console.log("🚀 Starting database optimization...");
  await connectDB();

  try {
    // 1. Analytics Events Indexes
    console.log("Optimizing AnalyticsEvent collection...");
    await AnalyticsEvent.collection.createIndex({ timestamp: -1 });
    await AnalyticsEvent.collection.createIndex({ userId: 1, timestamp: -1 });
    await AnalyticsEvent.collection.createIndex({
      eventType: 1,
      timestamp: -1,
    });
    await AnalyticsEvent.collection.createIndex({ sessionId: 1 });

    // 2. Revenue Metrics Indexes
    console.log("Optimizing RevenueMetrics collection...");
    await RevenueMetrics.collection.createIndex({ date: -1, period: 1 });

    // 3. Garage Performance Indexes
    console.log("Optimizing GaragePerformance collection...");
    await GaragePerformance.collection.createIndex({ garage: 1, date: -1 });
    await GaragePerformance.collection.createIndex({
      "performanceScore.overall": -1,
    });

    // 4. Conversion Funnel Indexes
    console.log("Optimizing ConversionFunnel collection...");
    await ConversionFunnel.collection.createIndex({ stepName: 1 });

    console.log("✅ Database optimization complete. Indexes created.");
  } catch (error) {
    console.error("❌ Optimization failed:", error);
  } finally {
    process.exit(0);
  }
}

optimizeDatabase();
