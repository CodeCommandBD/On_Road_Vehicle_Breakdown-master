import mongoose from "mongoose";

const garageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Garage name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true },
      postalCode: String,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [90.4125, 23.8103], // Dhaka default
      },
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    logo: {
      type: String,
      default: null,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    operatingHours: {
      monday: { open: String, close: String, isClosed: Boolean },
      tuesday: { open: String, close: String, isClosed: Boolean },
      wednesday: { open: String, close: String, isClosed: Boolean },
      thursday: { open: String, close: String, isClosed: Boolean },
      friday: { open: String, close: String, isClosed: Boolean },
      saturday: { open: String, close: String, isClosed: Boolean },
      sunday: { open: String, close: String, isClosed: Boolean },
    },
    is24Hours: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    vehicleTypes: {
      type: [String],
      enum: ["car", "motorcycle", "bus", "truck", "cng", "rickshaw", "other"],
      default: ["car", "motorcycle"],
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    completedBookings: {
      type: Number,
      default: 0,
    },
    verification: {
      tradeLicense: {
        number: String,
        imageUrl: String,
      },
      nid: {
        number: String,
        imageUrl: String,
      },
      ownerPhoto: String,
      status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      rejectionReason: String,
    },
    mechanicDetails: {
      leadName: { type: String, default: "" },
      experienceYears: { type: Number, default: 0 },
      specializations: [String],
      certifications: [
        {
          title: { type: String, default: "" },
          imageUrl: { type: String, default: "" },
        },
      ],
    },
    experience: {
      years: { type: Number, default: 0 },
      description: String,
    },
    specializedEquipments: [String],
    garageImages: {
      frontView: String,
      indoorView: String,
      additional: [String],
    },
    membershipTier: {
      type: String,
      enum: ["free", "basic", "standard", "premium", "enterprise", "trial"],
      default: "free",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    teamMembers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: String,
        email: String,
        phone: String,
        role: {
          type: String,
          enum: ["owner", "manager", "mechanic"],
          default: "mechanic",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location-based queries
garageSchema.index({ location: "2dsphere" });
garageSchema.index({ "rating.average": -1 });
garageSchema.index({ isActive: 1, isVerified: 1 });
garageSchema.index({ isFeatured: -1, membershipTier: 1 });

// Static method to find nearby garages
garageSchema.statics.findNearby = function (
  longitude,
  latitude,
  maxDistance = 10000
) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance, // in meters
      },
    },
    isActive: true,
  });
};

const Garage = mongoose.models.Garage || mongoose.model("Garage", garageSchema);

export default Garage;
