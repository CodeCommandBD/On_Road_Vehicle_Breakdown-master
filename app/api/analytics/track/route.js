import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { verifyToken } from "@/lib/utils/auth";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";
import {
  trackEvent,
  trackPageView,
  trackClick,
  trackFormSubmit,
  getDeviceInfo,
} from "@/lib/utils/analytics";

/**
 * POST /api/analytics/track
 * Track analytics events (page views, clicks, custom events)
 */
export async function POST(request) {
  // Rate limiting: 100 requests per minute
  const rateLimitResult = rateLimitMiddleware(request, 100, 60 * 1000);
  if (rateLimitResult) return rateLimitResult;

  try {
    await connectDB();

    const body = await request.json();
    const {
      eventType,
      eventName,
      page,
      properties = {},
      sessionId,
      anonymousId,
    } = body;

    // Get user if authenticated
    const token = request.cookies.get("token")?.value;
    const decoded = token ? await verifyToken(token) : null;
    const userId = decoded?.userId || null;

    // Get device info
    const userAgent = request.headers.get("user-agent");
    const device = getDeviceInfo(userAgent);

    // Get location from IP (basic)
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const location = {
      ip,
      // In production, use IP geolocation service
      country: "Bangladesh",
      city: "Unknown",
    };

    // Track based on event type
    switch (eventType) {
      case "page_view":
        await trackPageView({
          userId,
          sessionId,
          anonymousId,
          url: page?.url,
          path: page?.path,
          title: page?.title,
          referrer: page?.referrer,
          device,
          location,
        });
        break;

      case "button_click":
        await trackClick({
          userId,
          sessionId,
          buttonName: properties.buttonName,
          buttonId: properties.buttonId,
          page,
          properties,
        });
        break;

      case "form_submit":
        await trackFormSubmit({
          userId,
          sessionId,
          formName: properties.formName,
          formId: properties.formId,
          success: properties.success,
          page,
          properties,
        });
        break;

      default:
        // Generic event tracking
        await trackEvent({
          eventType,
          eventName,
          userId,
          sessionId,
          anonymousId,
          page,
          properties,
          device,
          location,
        });
    }

    return NextResponse.json({
      success: true,
      message: "Event tracked successfully",
    });
  } catch (error) {
    console.error("Analytics track error:", error);

    // Don't fail - analytics should never break the app
    return NextResponse.json({
      success: true,
      message: "Event received",
    });
  }
}

/**
 * GET /api/analytics/track
 * Get analytics events (admin only)
 */
export async function GET(request) {
  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("eventType");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "100");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const AnalyticsEvent = (await import("@/lib/db/models/AnalyticsEvent"))
      .default;

    let query = {};

    if (eventType) query.eventType = eventType;
    if (userId) query.userId = userId;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const events = await AnalyticsEvent.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate("userId", "name email");

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
