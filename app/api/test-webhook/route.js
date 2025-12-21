import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { verifyToken } from "@/lib/utils/auth";
import { triggerWebhook } from "@/lib/utils/webhook";

// Test webhook endpoint
export async function POST(req) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🧪 Testing webhook for user:", user.userId);

    // Send test webhook
    await triggerWebhook(user.userId, "sos.created", {
      sosId: "test-123",
      location: {
        type: "Point",
        coordinates: [90.4125, 23.8103],
        address: "Test Location - Dhaka, Bangladesh",
      },
      status: "pending",
      vehicleType: "car",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Test webhook sent! Check your Slack channel.",
    });
  } catch (error) {
    console.error("Test webhook error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
