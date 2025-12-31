import mongoose from "mongoose";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

const log = (msg) => {
  try {
    const logFile = path.join(process.cwd(), "debug.log");
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
  } catch (e) {}
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^(\+88)?01[3-9]\d{8}$/,
        "Please enter a valid Bangladeshi phone number",
      ],
    },
    role: {
      type: String,
      enum: ["user", "garage", "admin", "mechanic"],
      default: "user",
    },
    avatar: {
      type: String,
      default: null,
    },
    address: {
      street: String,
      city: String,
      district: String,
      postalCode: String,
    },
    membershipTier: {
      type: String,
      enum: [
        "free",
        "trial",
        "standard",
        "premium",
        "enterprise",
        "garage_basic",
        "garage_pro",
      ],
      default: "free",
    },
    membershipExpiry: {
      type: Date,
      default: null,
    },
    // Subscription reference
    currentSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    // Trial tracking
    hasUsedTrial: {
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
    lastLogin: {
      type: Date,
      default: null,
    },
    onlineStatus: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    vehicles: [
      {
        make: { type: String, required: true },
        model: { type: String, required: true },
        year: { type: Number },
        licensePlate: { type: String, required: true },
        color: String,
        vehicleType: {
          type: String,
          enum: ["Car", "Motorcycle", "Truck", "Bus", "Van", "Other"],
          default: "Car",
        },
      },
    ],
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      serviceReminders: { type: Boolean, default: true },
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
      address: String,
    },
    rewardPoints: {
      type: Number,
      default: 0,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    accountManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    branding: {
      companyName: String,
      logoUrl: String,
      primaryColor: { type: String, default: "#EF4444" },
    },
    contract: {
      documentUrl: String, // Link to PDF
      startDate: Date,
      endDate: Date,
      status: {
        type: String,
        enum: ["active", "expired", "pending"],
        default: "pending",
      },
      customTerms: String,
    },
    favoriteGarages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Garage",
      },
    ],
    // MECHANIC SPECIFIC FIELDS
    garageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garage",
      default: null,
    },
    availability: {
      status: {
        type: String,
        enum: ["online", "offline", "busy"],
        default: "offline",
      },
      lastUpdated: Date,
    },
    mechanicProfile: {
      skills: [String],
      experience: Number,
      rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
      },
      completedJobs: { type: Number, default: 0 },
    },
    // ENTERPRISE TEAM MANAGEMENT
    enterpriseTeam: {
      isOwner: {
        type: Boolean,
        default: true, // If enterprise tier, default to owner
      },
      parentAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null, // Null if owner, points to owner if member
      },
      members: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          name: String,
          email: String,
          role: {
            type: String,
            enum: ["admin", "member", "viewer"],
            default: "member",
          },
          addedAt: {
            type: Date,
            default: Date.now,
          },
          addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  // Auto-calculate Level and Tier based on points
  if (this.isModified("rewardPoints") && this.role !== "admin") {
    const points = this.rewardPoints || 0;

    // Level determination
    if (points >= 3000) {
      this.level = 4;
      // Only upgrade to premium if they aren't already enterprise
      if (this.membershipTier !== "enterprise") {
        this.membershipTier = "premium";
      }
    } else if (points >= 1500) {
      this.level = 3;
      // Only update if they aren't already premium or enterprise
      if (
        this.membershipTier !== "premium" &&
        this.membershipTier !== "enterprise" &&
        this.membershipTier !== "garage_pro"
      ) {
        this.membershipTier = "standard";
      }
    } else {
      this.level = 1;
      // ONLY demote if they weren't in a paid/higher tier
      if (
        this.membershipTier !== "premium" &&
        this.membershipTier !== "enterprise" &&
        this.membershipTier !== "standard" &&
        this.membershipTier !== "garage_pro" &&
        this.membershipTier !== "garage_basic"
      ) {
        this.membershipTier = "free";
      }
    }
  }

  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (without sensitive data)
userSchema.methods.toPublicJSON = function () {
  // log(`toPublicJSON called for user: ${this.email} (ID: ${this._id})`);

  const obj = {
    _id: this._id ? this._id.toString() : null,
    name: this.name || "No Name",
    email: this.email || "",
    phone: this.phone || "",
    role: this.role || "user",
    avatar: this.avatar || null,
    address: this.address || {},
    membershipTier: this.membershipTier || "free",
    membershipExpiry: this.membershipExpiry,
    isActive: this.isActive,
    isVerified: !!this.isVerified,
    vehicles: this.vehicles || [],
    notificationPreferences: this.notificationPreferences || {},
    rewardPoints: this.rewardPoints || 0,
    totalBookings: this.totalBookings || 0,
    totalSpent: this.totalSpent || 0,
    level: this.level || 1,
    favoriteGarages: this.favoriteGarages || [],
    createdAt: this.createdAt,
    availability: this.availability || { status: "offline" },
    garageId: this.garageId, // Populated object or ID
    mechanicProfile: this.mechanicProfile,
    enterpriseTeam: this.enterpriseTeam,
    isTeamMember:
      (this.membershipTier === "enterprise" ||
        this.membershipTier === "premium") &&
      !!this.enterpriseTeam?.parentAccount,
    isEnterpriseOwner:
      (this.membershipTier === "enterprise" ||
        this.membershipTier === "premium") &&
      !!this.enterpriseTeam?.isOwner,
  };

  if (this.location && this.location.coordinates) {
    obj.location = {
      type: "Point",
      coordinates: this.location.coordinates,
    };
  } else {
    obj.location = {
      type: "Point",
      coordinates: [90.4125, 23.8103],
    };
  }

  // log(`Returning obj: ${JSON.stringify(obj)}`);
  return obj;
};

// Indexes
// email already has unique: true, which creates an index
userSchema.index({ role: 1 });
userSchema.index({ location: "2dsphere" });

// Basic model export
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
