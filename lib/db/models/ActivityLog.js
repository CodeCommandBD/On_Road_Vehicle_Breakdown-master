import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "org_created",
        "org_updated",
        "org_deleted",
        "member_added",
        "member_removed",
        "member_invited",
        "invitation_accepted",
        "invitation_cancelled",
        "role_changed",
        "settings_updated",
        "webhook_configured",
        "webhook_tested",
        "sos_created",
        "sos_resolved",
      ],
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    targetEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for querying
activityLogSchema.index({ organization: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ organization: 1, action: 1, createdAt: -1 });
activityLogSchema.index({ organization: 1, severity: 1, createdAt: -1 });

// TTL index - auto-delete logs older than 90 days
activityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

// Static method to log activity
activityLogSchema.statics.log = async function (data) {
  const {
    organizationId,
    userId,
    action,
    targetUserId = null,
    targetEmail = null,
    metadata = {},
    changes = {},
    ipAddress = null,
    userAgent = null,
  } = data;

  // Determine severity based on action
  let severity = "low";
  const highSeverityActions = ["org_deleted", "member_removed", "role_changed"];
  const mediumSeverityActions = [
    "member_added",
    "settings_updated",
    "webhook_configured",
  ];

  if (highSeverityActions.includes(action)) {
    severity = "high";
  } else if (mediumSeverityActions.includes(action)) {
    severity = "medium";
  }

  return this.create({
    organization: organizationId,
    user: userId,
    action,
    targetUser: targetUserId,
    targetEmail,
    metadata,
    changes,
    ipAddress,
    userAgent,
    severity,
  });
};

// Static method to get recent activities
activityLogSchema.statics.getRecent = function (organizationId, limit = 50) {
  return this.find({ organization: organizationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("user", "name email")
    .populate("targetUser", "name email")
    .lean();
};

// Static method to get activities by user
activityLogSchema.statics.getByUser = function (userId, limit = 50) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("organization", "name")
    .lean();
};

const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
