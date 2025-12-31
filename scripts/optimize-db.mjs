import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../lib/db/connect.js";
import AnalyticsEvent from "../lib/db/models/AnalyticsEvent.js";
import RevenueMetrics from "../lib/db/models/RevenueMetrics.js";
import GaragePerformance from "../lib/db/models/GaragePerformance.js";
import ConversionFunnel from "../lib/db/models/ConversionFunnel.js";

async function optimizeDatabase() {
  console.log("🚀 Starting database optimization...");
  console.log("uri", process.env.MONGODB_URI ? "Found URI" : "No URI");

  // Connect manually if connectDB doesn't rely on global mongoose
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  try {
    // 1. Analytics Events Indexes
    console.log("Optimizing AnalyticsEvent collection...");
    // Check if collection exists first to avoid error on fresh DB
    const models = [
      AnalyticsEvent,
      RevenueMetrics,
      GaragePerformance,
      ConversionFunnel,
    ];

    for (const model of models) {
      try {
        await model.createIndexes();
        console.log(`✅ Indexes created for ${model.modelName}`);
      } catch (idxErr) {
        console.warn(
          `⚠️ Could not create index for ${model.modelName} (maybe collection empty): ${idxErr.message}`
        );
      }
    }

    console.log("✅ Database optimization complete.");
  } catch (error) {
    console.error("❌ Optimization failed:", error);
  } finally {
    process.exit(0);
  }
}

optimizeDatabase();
