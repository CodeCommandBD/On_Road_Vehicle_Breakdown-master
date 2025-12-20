import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Package name is required"],
      trim: true,
    },
    tier: {
      type: String,
      enum: ["standard", "premium"],
      required: true,
      unique: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    price: {
      monthly: {
        type: Number,
        required: true,
      },
      yearly: {
        type: Number,
        required: true,
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
// tier already has unique: true, which creates an index
packageSchema.index({ isActive: 1, order: 1 });

const Package =
  mongoose.models.Package || mongoose.model("Package", packageSchema);

export default Package;
