import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { verifyToken } from "@/lib/utils/auth";
import Integration from "@/lib/db/models/Integration";

// Debug webhook configuration
export async function GET(req) {
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

    const integration = await Integration.findOne({ user: user.userId });

    if (!integration) {
      return NextResponse.json({
        success: false,
        message: "No integration found. Please configure webhook first.",
        debug: {
          userId: user.userId,
          hasIntegration: false,
        },
      });
    }

    // Return detailed debug info
    return NextResponse.json({
      success: true,
      debug: {
        hasIntegration: true,
        webhookUrl: integration.webhookUrl,
        isActive: integration.isActive,
        events: integration.events,
        secret: integration.secret.substring(0, 10) + "...", // Show partial
        failures: integration.failures,
        lastTriggeredAt: integration.lastTriggeredAt,
        rateLimitCount: integration.rateLimitCount,
        rateLimitResetAt: integration.rateLimitResetAt,
      },
    });
  } catch (error) {
    console.error("Debug webhook error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
