import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Integration from "@/lib/db/models/Integration";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import TeamMember from "@/lib/db/models/TeamMember";
import { verifyToken } from "@/lib/utils/auth";
import { sendWebhook, logResult } from "@/lib/utils/webhook";

const checkAccess = async (user) => {
  if (!user) return false;
  if (user.role === "admin") return true;

  const allowedTiers = ["premium", "enterprise"];
  if (allowedTiers.includes(user.membershipTier)) return true;

  const teamMembership = await TeamMember.findOne({
    user: user._id,
    isActive: true,
  });

  return !!teamMembership;
};

export async function POST(req) {
  try {
    const token = req.cookies.get("token")?.value;
    const decoded = await verifyToken(token);
    if (!decoded)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (!(await checkAccess(user))) {
      return NextResponse.json(
        { success: false, error: "Upgrade required" },
        { status: 403 }
      );
    }

    const query = {};
    if (user.role === "garage") {
      const garage = await Garage.findOne({ owner: user._id });
      if (garage) query.garage = garage._id;
      else query.user = user._id;
    } else {
      query.user = user._id;
    }

    const integration = await Integration.findOne(query);

    if (!integration || !integration.webhookUrl) {
      return NextResponse.json(
        { success: false, error: "Integration not configured" },
        { status: 400 }
      );
    }

    // Dummy payload for testing
    const testPayload = {
      test: true,
      event: "test.webhook",
      timestamp: new Date().toISOString(),
      message: "👋 This is a test webhook from your Automation Center!",
      data: {
        sosId: "TEST_SOS_ID_" + Math.random().toString(36).substring(7),
        location: {
          address: "Test Location, Road 7, Dhaka",
          coordinates: [90.4125, 23.8103],
        },
        user: {
          name: user.name,
          phone: user.phone || "017XXXXXXXX",
        },
        status: "testing",
        vehicleType: "Car",
        createdAt: new Date().toISOString(),
      },
    };

    const result = await sendWebhook(
      integration.webhookUrl,
      integration.secret,
      "test.connection",
      testPayload,
      { payloadFormat: integration.payloadFormat }
    );

    // Save result to the logs array
    await logResult(integration, "test.connection", result, testPayload);

    return NextResponse.json({
      success: result.ok,
      message: result.ok ? "Test webhook sent successfully!" : "Webhook failed",
      status: result.status,
      error: result.error,
    });
  } catch (error) {
    console.error("Test Webhook Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
