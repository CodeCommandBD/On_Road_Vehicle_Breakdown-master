import connectDB from "@/lib/db/connect";
import AnalyticsEvent from "@/lib/db/models/AnalyticsEvent";

async function verifyTracking() {
  await connectDB();
  console.log("🔍 Verifying Analytics Tracking...");

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
    console.log("⚠️ No events found. System might be idle or tracking broken.");
  }
  process.exit(0);
}

verifyTracking();
