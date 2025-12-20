import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },
    tier: {
      type: String,
      required: [true, "Plan tier is required"],
      enum: ["free", "basic", "standard", "premium", "enterprise", "trial"], // Added free/basic
      unique: true,
    },
    price: {
      monthly: {
        type: Number,
        required: [true, "Monthly price is required"],
        min: 0,
      },
      yearly: {
        type: Number,
        required: [true, "Yearly price is required"],
        min: 0,
      },
    },
    features: [
      {
        type: String,
        required: true,
      },
    ],
    highlightFeature: {
      type: String, // e.g., "Most Popular" text to show on card
    },
    limits: {
      serviceCalls: {
        type: Number,
        default: -1, // -1 means unlimited
      },
      serviceRadius: {
        // Added service radius in KM
        type: Number,
        default: 5,
      },
      responseTime: {
        type: Number, // in minutes
        required: true,
      },
      vehicles: {
        type: Number,
        default: 1,
      },
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate yearly discount percentage
planSchema.virtual("yearlyDiscount").get(function () {
  if (!this.price.monthly || !this.price.yearly) return 0;
  const monthlyTotal = this.price.monthly * 12;
  const discount = ((monthlyTotal - this.price.yearly) / monthlyTotal) * 100;
  return Math.round(discount);
});

// Indexes
// tier already has unique: true, which creates an index
planSchema.index({ isActive: 1 });
planSchema.index({ displayOrder: 1 });

// Standard singleton pattern
const Plan = mongoose.models.Plan || mongoose.model("Plan", planSchema);

export default Plan;
