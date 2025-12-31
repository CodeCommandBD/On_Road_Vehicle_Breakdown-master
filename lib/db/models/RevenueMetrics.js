import mongoose from "mongoose";

/**
 * Revenue Metrics Model
 * Stores calculated revenue metrics (MRR, ARR, ARPU, LTV, Churn)
 * Updated daily by background jobs
 */
const revenueMetricsSchema = new mongoose.Schema(
  {
    // Time Period
    date: {
      type: Date,
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
      index: true,
    },

    // Monthly Recurring Revenue
    mrr: {
      total: { type: Number, default: 0 },
      new: { type: Number, default: 0 }, // New MRR from new customers
      expansion: { type: Number, default: 0 }, // Upgrades
      contraction: { type: Number, default: 0 }, // Downgrades
      churn: { type: Number, default: 0 }, // Lost MRR
      growth: { type: Number, default: 0 }, // % growth
    },

    // Annual Recurring Revenue
    arr: {
      total: { type: Number, default: 0 },
      growth: { type: Number, default: 0 },
    },

    // Average Revenue Per User
    arpu: {
      overall: { type: Number, default: 0 },
      byPlan: {
        free: { type: Number, default: 0 },
        trial: { type: Number, default: 0 },
        standard: { type: Number, default: 0 },
        premium: { type: Number, default: 0 },
        enterprise: { type: Number, default: 0 },
      },
    },

    // Customer Lifetime Value
    ltv: {
      average: { type: Number, default: 0 },
      byPlan: {
        standard: { type: Number, default: 0 },
        premium: { type: Number, default: 0 },
        enterprise: { type: Number, default: 0 },
      },
    },

    // Churn Rate
    churn: {
      rate: { type: Number, default: 0 }, // Percentage
      count: { type: Number, default: 0 }, // Number of churned customers
      revenue: { type: Number, default: 0 }, // Lost revenue
    },

    // Customer Metrics
    customers: {
      total: { type: Number, default: 0 },
      new: { type: Number, default: 0 },
      active: { type: Number, default: 0 },
      churned: { type: Number, default: 0 },
    },

    // Revenue by Source
    revenueBySource: {
      subscriptions: { type: Number, default: 0 },
      bookings: { type: Number, default: 0 },
      aiDiagnose: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },

    // Revenue by Plan
    revenueByPlan: {
      standard: { type: Number, default: 0 },
      premium: { type: Number, default: 0 },
      enterprise: { type: Number, default: 0 },
    },

    // Forecast (next month)
    forecast: {
      mrr: { type: Number, default: 0 },
      arr: { type: Number, default: 0 },
      customers: { type: Number, default: 0 },
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
revenueMetricsSchema.index({ date: -1, period: 1 });
revenueMetricsSchema.index({ period: 1, date: -1 });

// Ensure unique entry per date/period
revenueMetricsSchema.index({ date: 1, period: 1 }, { unique: true });

const RevenueMetrics =
  mongoose.models.RevenueMetrics ||
  mongoose.model("RevenueMetrics", revenueMetricsSchema);

export default RevenueMetrics;
