import AnalyticsEvent from "@/lib/db/models/AnalyticsEvent";
import ConversionFunnel from "@/lib/db/models/ConversionFunnel";

/**
 * Analytics Tracking Utility
 * Provides functions to track events, page views, and conversions
 */

/**
 * Track a generic event
 */
export async function trackEvent({
  eventType,
  eventName,
  userId,
  sessionId,
  anonymousId,
  page,
  properties = {},
  device = {},
  location = {},
  metadata = {},
}) {
  try {
    await AnalyticsEvent.create({
      eventType,
      eventName,
      userId,
      sessionId,
      anonymousId,
      page,
      properties,
      device,
      location,
      metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    // Don't throw - analytics should never break the app
  }
}

/**
 * Track page view
 */
export async function trackPageView({
  userId,
  sessionId,
  anonymousId,
  url,
  path,
  title,
  referrer,
  device = {},
  location = {},
}) {
  return trackEvent({
    eventType: "page_view",
    eventName: `Page View: ${path}`,
    userId,
    sessionId,
    anonymousId,
    page: { url, path, title, referrer },
    device,
    location,
  });
}

/**
 * Track button click
 */
export async function trackClick({
  userId,
  sessionId,
  buttonName,
  buttonId,
  page,
  properties = {},
}) {
  return trackEvent({
    eventType: "button_click",
    eventName: `Click: ${buttonName}`,
    userId,
    sessionId,
    page,
    properties: {
      buttonName,
      buttonId,
      ...properties,
    },
  });
}

/**
 * Track form submission
 */
export async function trackFormSubmit({
  userId,
  sessionId,
  formName,
  formId,
  success,
  page,
  properties = {},
}) {
  return trackEvent({
    eventType: "form_submit",
    eventName: `Form Submit: ${formName}`,
    userId,
    sessionId,
    page,
    properties: {
      formName,
      formId,
      success,
      ...properties,
    },
  });
}

/**
 * Track signup
 */
export async function trackSignup({
  userId,
  email,
  method,
  plan = "free",
  sessionId,
  source = {},
}) {
  return trackEvent({
    eventType: "signup",
    eventName: "User Signup",
    userId,
    sessionId,
    properties: {
      email,
      method,
      plan,
      source,
    },
  });
}

/**
 * Track booking creation
 */
export async function trackBookingCreated({
  userId,
  bookingId,
  garageId,
  serviceType,
  amount,
  sessionId,
}) {
  return trackEvent({
    eventType: "booking_created",
    eventName: "Booking Created",
    userId,
    sessionId,
    properties: {
      bookingId,
      garageId,
      serviceType,
      amount,
    },
  });
}

/**
 * Track payment
 */
export async function trackPayment({
  userId,
  amount,
  currency = "BDT",
  paymentMethod,
  status,
  bookingId,
  subscriptionId,
  sessionId,
}) {
  const eventType =
    status === "completed" ? "payment_completed" : "payment_initiated";

  return trackEvent({
    eventType,
    eventName: `Payment ${status}`,
    userId,
    sessionId,
    properties: {
      amount,
      currency,
      paymentMethod,
      status,
      bookingId,
      subscriptionId,
    },
  });
}

/**
 * Track subscription
 */
export async function trackSubscription({
  userId,
  subscriptionId,
  plan,
  amount,
  status,
  sessionId,
}) {
  const eventType =
    status === "cancelled" ? "subscription_cancelled" : "subscription_started";

  return trackEvent({
    eventType,
    eventName: `Subscription ${status}`,
    userId,
    sessionId,
    properties: {
      subscriptionId,
      plan,
      amount,
      status,
    },
  });
}

/**
 * Start a conversion funnel
 */
export async function startFunnel({
  funnelType,
  funnelName,
  userId,
  sessionId,
  totalSteps,
  source = {},
}) {
  try {
    const funnel = await ConversionFunnel.create({
      funnelType,
      funnelName,
      userId,
      sessionId,
      totalSteps,
      currentStep: 0,
      status: "in_progress",
      source,
      startedAt: new Date(),
    });

    return funnel._id;
  } catch (error) {
    console.error("Funnel start error:", error);
    return null;
  }
}

/**
 * Update funnel step
 */
export async function updateFunnelStep({
  funnelId,
  stepName,
  stepOrder,
  timeSpent = 0,
  metadata = {},
}) {
  try {
    const funnel = await ConversionFunnel.findById(funnelId);
    if (!funnel) return;

    funnel.steps.push({
      stepName,
      stepOrder,
      completedAt: new Date(),
      timeSpent,
      metadata,
    });

    funnel.currentStep = stepOrder;

    // Check if funnel is completed
    if (stepOrder >= funnel.totalSteps) {
      funnel.status = "completed";
      funnel.completedAt = new Date();
      funnel.converted = true;
      funnel.totalDuration = Math.floor(
        (funnel.completedAt - funnel.startedAt) / 1000
      );
    }

    await funnel.save();
  } catch (error) {
    console.error("Funnel update error:", error);
  }
}

/**
 * Abandon funnel
 */
export async function abandonFunnel(funnelId) {
  try {
    await ConversionFunnel.findByIdAndUpdate(funnelId, {
      status: "abandoned",
      abandonedAt: new Date(),
    });
  } catch (error) {
    console.error("Funnel abandon error:", error);
  }
}

/**
 * Complete funnel with conversion value
 */
export async function completeFunnel({ funnelId, conversionValue = 0 }) {
  try {
    const funnel = await ConversionFunnel.findById(funnelId);
    if (!funnel) return;

    funnel.status = "completed";
    funnel.completedAt = new Date();
    funnel.converted = true;
    funnel.conversionValue = conversionValue;
    funnel.totalDuration = Math.floor(
      (funnel.completedAt - funnel.startedAt) / 1000
    );

    await funnel.save();
  } catch (error) {
    console.error("Funnel complete error:", error);
  }
}

/**
 * Get device info from user agent
 */
export function getDeviceInfo(userAgent) {
  if (!userAgent) return { type: "desktop", os: "unknown", browser: "unknown" };

  const ua = userAgent.toLowerCase();

  // Device type
  let type = "desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    type = "tablet";
  } else if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    type = "mobile";
  }

  // OS
  let os = "unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac/i.test(ua)) os = "MacOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/android/i.test(ua)) os = "Android";
  else if (/ios|iphone|ipad/i.test(ua)) os = "iOS";

  // Browser
  let browser = "unknown";
  if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";
  else if (/edge/i.test(ua)) browser = "Edge";
  else if (/opera/i.test(ua)) browser = "Opera";

  return { type, os, browser };
}

/**
 * Generate session ID
 */
export function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate anonymous ID
 */
export function generateAnonymousId() {
  return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
