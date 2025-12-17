import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      enum: [
        "engine",
        "electrical",
        "tire",
        "battery",
        "fuel",
        "towing",
        "lockout",
        "ac",
        "brake",
        "general",
        "other",
      ],
      default: "general",
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    priceRange: {
      min: Number,
      max: Number,
    },
    duration: {
      estimated: {
        type: Number, // in minutes
        default: 60,
      },
      min: Number,
      max: Number,
    },
    icon: {
      type: String,
      default: "wrench",
    },
    image: {
      type: String,
      default: null,
    },
    vehicleTypes: {
      type: [String],
      enum: ["car", "motorcycle", "bus", "truck", "cng", "rickshaw", "other"],
      default: ["car", "motorcycle"],
    },
    isEmergency: {
      type: Boolean,
      default: false,
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
  },
  {
    timestamps: true,
  }
);

// Generate slug before saving
serviceSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

// Indexes
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1, isPopular: -1 });
// slug already has unique: true, which creates an index

const Service =
  mongoose.models.Service || mongoose.model("Service", serviceSchema);

export default Service;
