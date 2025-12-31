import mongoose from "mongoose";

const redemptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reward",
      required: true,
    },
    pointsSpent: {
      type: Number,
      required: true,
    },
    code: {
      type: String,
      unique: true, // Unique coupon code or identifier
    },
    status: {
      type: String,
      enum: ["active", "used", "expired", "revoked"],
      default: "active",
    },
    expiresAt: {
      type: Date,
    },
    usedAt: {
      type: Date,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

const Redemption =
  mongoose.models.Redemption || mongoose.model("Redemption", redemptionSchema);

export default Redemption;
