import mongoose from "mongoose";

/**
 * Conversion Funnel Model
 * Tracks user progress through conversion funnels
 */
const conversionFunnelSchema = new mongoose.Schema(
  {
    // Funnel Details
    funnelType: {
      type: String,
      required: true,
      enum: ["signup", "booking", "subscription", "custom"],
      index: true,
    },
    funnelName: {
      type: String,
      required: true,
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

    // Funnel Steps
    steps: [
      {
        stepName: {
          type: String,
          required: true,
        },
        stepOrder: {
          type: Number,
          required: true,
        },
        completedAt: Date,
        timeSpent: Number, // Seconds spent on this step
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],

    // Funnel Status
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
      index: true,
    },
    currentStep: {
      type: Number,
      default: 0,
    },
    totalSteps: {
      type: Number,
      required: true,
    },

    // Timing
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: Date,
    abandonedAt: Date,
    totalDuration: Number, // Total time to complete funnel (seconds)

    // Conversion Details
    converted: {
      type: Boolean,
      default: false,
      index: true,
    },
    conversionValue: Number, // Revenue generated from this conversion

    // Source Tracking
    source: {
      utm_source: String,
      utm_medium: String,
      utm_campaign: String,
      referrer: String,
    },

    // Metadata
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
conversionFunnelSchema.index({ funnelType: 1, status: 1, startedAt: -1 });
conversionFunnelSchema.index({ userId: 1, funnelType: 1 });
conversionFunnelSchema.index({ converted: 1, completedAt: -1 });

// Virtual for conversion rate
conversionFunnelSchema.virtual("progressPercentage").get(function () {
  return ((this.currentStep / this.totalSteps) * 100).toFixed(2);
});

conversionFunnelSchema.set("toJSON", { virtuals: true });
conversionFunnelSchema.set("toObject", { virtuals: true });

const ConversionFunnel =
  mongoose.models.ConversionFunnel ||
  mongoose.model("ConversionFunnel", conversionFunnelSchema);

export default ConversionFunnel;
