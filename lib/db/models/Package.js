import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Package name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["user", "garage"],
      default: "user",
      required: true,
    },
    tier: {
      type: String,
      required: true,
      // unique: true, // Removed simple unique index
    },
    promoEndsAt: {
      type: Date,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    price: {
      monthly: {
        type: Number,
        default: 0,
      },
      yearly: {
        type: Number,
        default: 0,
      },
      isCustom: {
        type: Boolean,
        default: false,
      },
    },
    currency: {
      type: String,
      default: "BDT",
    },
    features: [
      {
        name: String,
        included: Boolean,
        limit: String, // e.g., "5 per month", "Unlimited"
      },
    ],
    benefits: [String],
    discount: {
      type: Number, // percentage discount
      default: 0,
    },
    badge: {
      type: String, // e.g., "Most Popular", "Limited Slots"
      default: "",
    },
    prioritySupport: {
      type: Boolean,
      default: false,
    },
    emergencyResponse: {
      type: String,
      enum: ["normal", "priority", "immediate"],
      default: "normal",
    },
    freeServices: {
      type: Number, // number of free services per month
      default: 0,
    },
    discountOnServices: {
      type: Number, // percentage discount on services
      default: 0,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    color: {
      type: String, // for UI styling
      default: "#f94f00",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Compound index to ensure tier names are unique WITHIN a type
packageSchema.index({ tier: 1, type: 1 }, { unique: true });
packageSchema.index({ isActive: 1, order: 1 });

const Package =
  mongoose.models.Package || mongoose.model("Package", packageSchema);

export default Package;
