import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Integration from "@/lib/db/models/Integration";
import { verifyToken } from "@/lib/utils/auth";

// GET: Fetch current config
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

    return NextResponse.json({
      success: true,
      data: integration || null,
    });
  } catch (error) {
    console.error("Integration Fetch Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

// POST: Save/Update config
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

    const { webhookUrl, isActive } = await req.json();

    // Basic Validation
    if (webhookUrl && !webhookUrl.startsWith("http")) {
      return NextResponse.json(
        { success: false, message: "Invalid URL" },
        { status: 400 }
      );
    }

    let integration = await Integration.findOne({ user: user.userId });

    if (integration) {
      // Update
      integration.webhookUrl = webhookUrl;
      integration.isActive = isActive;
      await integration.save();
    } else {
      // Create
      integration = await Integration.create({
        user: user.userId,
        webhookUrl,
        isActive: isActive !== undefined ? isActive : true,
      });
    }

    return NextResponse.json({
      success: true,
      data: integration,
      message: "Webhook settings saved successfully",
    });
  } catch (error) {
    console.error("Integration Save Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
