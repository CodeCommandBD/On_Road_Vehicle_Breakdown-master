import mongoose from "mongoose";

const integrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One webhook config per user for now
    },
    webhookUrl: {
      type: String,
      required: true,
      trim: true,
    },
    secret: {
      type: String,
      required: true,
      default: () => Math.random().toString(36).substring(2, 15),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    events: {
      type: [String],
      default: ["sos.created", "sos.updated"], // Default events
    },
    failures: {
      type: Number,
      default: 0,
    },
    lastTriggeredAt: {
      type: Date,
    },
    // Rate Limiting
    rateLimitCount: {
      type: Number,
      default: 0,
    },
    rateLimitResetAt: {
      type: Date,
      default: () => new Date(Date.now() + 60000), // Reset every minute
    },
    // Secret Rotation
    secretRotatedAt: {
      type: Date,
      default: Date.now,
    },
    secretRotationHistory: [
      {
        oldSecret: String,
        rotatedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Integration =
  mongoose.models.Integration ||
  mongoose.model("Integration", integrationSchema);

export default Integration;
