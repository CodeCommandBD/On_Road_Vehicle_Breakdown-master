import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../lib/db/connect.js";
import AnalyticsEvent from "../lib/db/models/AnalyticsEvent.js";

async function verifyTracking() {
  // Connect manually if connectDB doesn't rely on global mongoose
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  console.log("🔍 Verifying Analytics Tracking...");

  try {
    const count = await AnalyticsEvent.countDocuments();
    console.log(`Total Events Tracked: ${count}`);

    const latest = await AnalyticsEvent.findOne().sort({ timestamp: -1 });
    if (latest) {
      console.log("✅ Latest Event Found:");
      console.log(`- Type: ${latest.eventType}`);
      console.log(`- Name: ${latest.eventName}`);
      console.log(`- Time: ${latest.timestamp}`);
      console.log("Tracking system is ACTIVE.");
    } else {
      console.log(
        "⚠️ No events found. System might be idle or tracking broken."
      );
    }
  } catch (err) {
    console.error("Verification error:", err);
  }
  process.exit(0);
}

verifyTracking();
