import mongoose from "mongoose";

/**
 * Garage Performance Model
 * Stores calculated performance metrics for each garage
 * Updated daily by background jobs
 */
const garagePerformanceSchema = new mongoose.Schema(
  {
    // Garage Reference
    garage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garage",
      required: true,
      index: true,
    },

    // Time Period
    date: {
      type: Date,
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly", "all_time"],
      required: true,
      index: true,
    },

    // Performance Score (0-100)
    performanceScore: {
      overall: { type: Number, default: 0, min: 0, max: 100 },
      breakdown: {
        bookings: { type: Number, default: 0 }, // 30% weight
        revenue: { type: Number, default: 0 }, // 25% weight
        satisfaction: { type: Number, default: 0 }, // 25% weight
        efficiency: { type: Number, default: 0 }, // 20% weight
      },
    },

    // Booking Metrics
    bookings: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 }, // Percentage
      cancellationRate: { type: Number, default: 0 },
      growth: { type: Number, default: 0 }, // % vs previous period
    },

    // Revenue Metrics
    revenue: {
      total: { type: Number, default: 0 },
      avgPerBooking: { type: Number, default: 0 },
      growth: { type: Number, default: 0 }, // % vs previous period
      byService: mongoose.Schema.Types.Mixed,
    },

    // Customer Satisfaction
    satisfaction: {
      rating: { type: Number, default: 0, min: 0, max: 5 },
      reviewCount: { type: Number, default: 0 },
      responseTime: { type: Number, default: 0 }, // Minutes
      repeatCustomers: { type: Number, default: 0 }, // Percentage
      nps: { type: Number, default: 0 }, // Net Promoter Score (-100 to 100)
    },

    // Efficiency Metrics
    efficiency: {
      avgServiceTime: { type: Number, default: 0 }, // Hours
      onTimeCompletion: { type: Number, default: 0 }, // Percentage
      firstTimeFixRate: { type: Number, default: 0 }, // Percentage
      utilizationRate: { type: Number, default: 0 }, // Percentage
    },

    // Ranking
    ranking: {
      overall: { type: Number, default: 0 },
      inCity: { type: Number, default: 0 },
      inCategory: { type: Number, default: 0 },
      totalGarages: { type: Number, default: 0 },
    },

    // Trends (vs previous period)
    trends: {
      bookings: {
        type: String,
        enum: ["up", "down", "stable"],
        default: "stable",
      },
      revenue: {
        type: String,
        enum: ["up", "down", "stable"],
        default: "stable",
      },
      rating: {
        type: String,
        enum: ["up", "down", "stable"],
        default: "stable",
      },
      performance: {
        type: String,
        enum: ["up", "down", "stable"],
        default: "stable",
      },
    },

    // Improvement Opportunities
    improvements: [
      {
        area: String,
        current: Number,
        target: Number,
        priority: { type: String, enum: ["low", "medium", "high"] },
        suggestion: String,
      },
    ],

    // Competitive Analysis
    competitive: {
      avgIndustry: {
        performanceScore: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        responseTime: { type: Number, default: 0 },
      },
      position: {
        type: String,
        enum: ["leader", "above_average", "average", "below_average"],
        default: "average",
      },
    },

    // Metadata
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
garagePerformanceSchema.index({ garage: 1, date: -1, period: 1 });
garagePerformanceSchema.index({ "performanceScore.overall": -1 });
garagePerformanceSchema.index({ "ranking.overall": 1 });
garagePerformanceSchema.index({ period: 1, date: -1 });

// Ensure unique entry per garage/date/period
garagePerformanceSchema.index(
  { garage: 1, date: 1, period: 1 },
  { unique: true }
);

const GaragePerformance =
  mongoose.models.GaragePerformance ||
  mongoose.model("GaragePerformance", garagePerformanceSchema);

export default GaragePerformance;
