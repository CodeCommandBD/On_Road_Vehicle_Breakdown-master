import mongoose from "mongoose";
import crypto from "crypto";

const teamInvitationSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "member", "viewer"],
      default: "member",
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired", "cancelled"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
    },
    acceptedAt: {
      type: Date,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    metadata: {
      customMessage: String,
      reminderSentAt: Date,
      reminderCount: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// teamInvitationSchema.index({ token: 1 }, { unique: true }); // Removed: Redundant
teamInvitationSchema.index({ organization: 1, email: 1, status: 1 });
teamInvitationSchema.index({ email: 1, status: 1 });
teamInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Generate unique token
teamInvitationSchema.statics.generateToken = function () {
  return crypto.randomUUID();
};

// Pre-save: set expiry if not provided
teamInvitationSchema.pre("save", function (next) {
  // defaults are now handled in schema definition
  next();
});

// Method to check if invitation is valid
teamInvitationSchema.methods.isValid = function () {
  return this.status === "pending" && this.expiresAt > new Date();
};

// Method to accept invitation
teamInvitationSchema.methods.accept = async function (userId) {
  if (!this.isValid()) {
    throw new Error("Invitation is no longer valid");
  }

  this.status = "accepted";
  this.acceptedAt = new Date();
  this.acceptedBy = userId;

  return this.save();
};

// Method to decline invitation
teamInvitationSchema.methods.decline = function () {
  this.status = "declined";
  return this.save();
};

// Static method to expire old invitations
teamInvitationSchema.statics.expireOldInvitations = async function () {
  return this.updateMany(
    {
      status: "pending",
      expiresAt: { $lt: new Date() },
    },
    {
      $set: { status: "expired" },
    }
  );
};

// In development, delete the model from mongoose to re-register with new schema
if (process.env.NODE_ENV === "development") {
  if (mongoose.models.TeamInvitation) {
    delete mongoose.models.TeamInvitation;
  }
}

const TeamInvitation =
  mongoose.models.TeamInvitation ||
  mongoose.model("TeamInvitation", teamInvitationSchema);

export default TeamInvitation;
