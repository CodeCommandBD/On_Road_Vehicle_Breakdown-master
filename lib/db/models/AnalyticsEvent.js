import mongoose from "mongoose";

/**
 * Analytics Event Model
 * Tracks all user interactions, page views, and custom events
 */
const analyticsEventSchema = new mongoose.Schema(
  {
    // Event Details
    eventType: {
      type: String,
      required: true,
      enum: [
        "page_view",
        "button_click",
        "form_submit",
        "signup",
        "login",
        "booking_created",
        "booking_completed",
        "payment_initiated",
        "payment_completed",
        "subscription_started",
        "subscription_cancelled",
        "garage_viewed",
        "service_selected",
        "custom",
      ],
      index: true,
    },
    eventName: {
      type: String,
      required: true,
      index: true,
    },

    // User Information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    anonymousId: String, // For non-logged-in users

    // Page/Location
    page: {
      url: String,
      path: String,
      title: String,
      referrer: String,
    },

    // Event Properties
    properties: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Device & Browser
    device: {
      type: {
        type: String,
        enum: ["mobile", "tablet", "desktop"],
      },
      os: String,
      browser: String,
      screenSize: String,
    },

    // Location
    location: {
      country: String,
      city: String,
      ip: String,
    },

    // Timing
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    duration: Number, // For events with duration (e.g., time on page)

    // Metadata
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });
analyticsEventSchema.index({ "page.path": 1, timestamp: -1 });

// TTL Index - Auto-delete events older than 1 year
analyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

const AnalyticsEvent =
  mongoose.models.AnalyticsEvent ||
  mongoose.model("AnalyticsEvent", analyticsEventSchema);

export default AnalyticsEvent;
