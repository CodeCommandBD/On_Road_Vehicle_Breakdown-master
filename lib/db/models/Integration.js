import mongoose from "mongoose";

const integrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional if garage is present
    },
    garage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garage",
      required: false,
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
    successCount: {
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
    payloadFormat: {
      type: String,
      enum: ["slack", "json"],
      default: "slack",
    },
    logs: [
      {
        event: String,
        status: String,
        statusCode: Number,
        message: String,
        timestamp: { type: Date, default: Date.now },
        payload: Object,
      },
    ],
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

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Integration;
}

const Integration =
  mongoose.models.Integration ||
  mongoose.model("Integration", integrationSchema);

export default Integration;
