import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    type: {
      type: String,
      enum: [
        "booking_new",
        "booking_update",
        "payment_success",
        "payment_update",
        "system_alert",
        "message_new",
        "info",
        "success",
        "action_required",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String, // e.g., /garage/dashboard/bookings/[id]
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster fetching of user notifications
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
