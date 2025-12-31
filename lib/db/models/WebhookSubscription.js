import mongoose from "mongoose";

const WebhookSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    url: {
      type: String,
      required: [true, "Webhook URL is required"],
    },
    events: {
      type: [String],
      enum: ["booking.created", "booking.updated", "payment.success"],
      required: true,
    },
    secret: {
      type: String, // Used to sign the payload logic
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.WebhookSubscription ||
  mongoose.model("WebhookSubscription", WebhookSubscriptionSchema);
