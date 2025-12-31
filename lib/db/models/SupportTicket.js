import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },
    category: {
      type: String,
      enum: ["general", "technical", "billing", "account", "booking", "other"],
      default: "general",
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "waiting", "resolved", "closed"],
      default: "open",
      index: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    resolvedAt: Date,
    closedAt: Date,
    tags: [String],
    attachments: [
      {
        url: String,
        filename: String,
        fileType: String,
      },
    ],
    internalNotes: [
      {
        agent: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        note: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
supportTicketSchema.index({ user: 1, status: 1 });
supportTicketSchema.index({ assignedAgent: 1, status: 1 });
supportTicketSchema.index({ priority: 1, status: 1 });
supportTicketSchema.index({ createdAt: -1 });

// Virtual for ticket number
supportTicketSchema.virtual("ticketNumber").get(function () {
  return `TKT-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Ensure virtuals are included in JSON
supportTicketSchema.set("toJSON", { virtuals: true });
supportTicketSchema.set("toObject", { virtuals: true });

const SupportTicket =
  mongoose.models.SupportTicket ||
  mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;
