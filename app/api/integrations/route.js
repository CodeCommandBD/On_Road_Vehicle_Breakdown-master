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

    // ============================================
    // SECURITY VALIDATION
    // ============================================

    if (webhookUrl) {
      // 1. Check if URL format is valid
      if (!webhookUrl.startsWith("http")) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid URL format. Must start with http:// or https://",
          },
          { status: 400 }
        );
      }

      // 2. HTTPS ONLY - Security Check
      if (!webhookUrl.startsWith("https://")) {
        return NextResponse.json(
          {
            success: false,
            message:
              "🔒 Security Error: Only HTTPS URLs are allowed for webhooks. HTTP is not secure.",
          },
          { status: 400 }
        );
      }

      // 3. URL Length Check (prevent extremely long URLs)
      if (webhookUrl.length > 500) {
        return NextResponse.json(
          {
            success: false,
            message: "URL is too long. Maximum 500 characters allowed.",
          },
          { status: 400 }
        );
      }

      // 4. Basic URL structure validation
      try {
        new URL(webhookUrl);
      } catch (urlError) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid URL structure. Please check your webhook URL.",
          },
          { status: 400 }
        );
      }
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

// PATCH: Rotate webhook secret
export async function PATCH(req) {
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
      return NextResponse.json(
        { success: false, message: "No integration found" },
        { status: 404 }
      );
    }

    // Save old secret to history
    const oldSecret = integration.secret;
    integration.secretRotationHistory.push({
      oldSecret: oldSecret,
      rotatedAt: new Date(),
    });

    // Generate new secret
    integration.secret =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    integration.secretRotatedAt = new Date();

    // Keep only last 5 rotations in history
    if (integration.secretRotationHistory.length > 5) {
      integration.secretRotationHistory =
        integration.secretRotationHistory.slice(-5);
    }

    await integration.save();

    return NextResponse.json({
      success: true,
      message:
        "Webhook secret rotated successfully. Please update your verification code.",
      data: {
        newSecret: integration.secret,
        rotatedAt: integration.secretRotatedAt,
      },
    });
  } catch (error) {
    console.error("Secret Rotation Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
