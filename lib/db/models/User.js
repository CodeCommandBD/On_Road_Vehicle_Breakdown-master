import mongoose from "mongoose";
import bcrypt from "bcrypt";

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
      enum: ["user", "garage", "admin"],
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
      enum: ["free", "trial", "basic", "standard", "premium", "enterprise"],
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
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (without sensitive data)
userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    avatar: this.avatar,
    address: this.address,
    membershipTier: this.membershipTier,
    isVerified: this.isVerified,
    vehicles: this.vehicles,
    notificationPreferences: this.notificationPreferences,
    createdAt: this.createdAt,
  };
};

// Indexes
// email already has unique: true, which creates an index
userSchema.index({ role: 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
