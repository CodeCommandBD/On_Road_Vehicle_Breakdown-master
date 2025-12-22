import ActivityLog from "@/lib/db/models/ActivityLog";

/**
 * Log activity for organization actions
 * @param {Object} params - Activity parameters
 * @returns {Promise<ActivityLog>}
 */
export async function logActivity({
  organizationId,
  userId,
  action,
  targetUserId = null,
  targetEmail = null,
  metadata = {},
  changes = {},
  req = null, // Express/Next request object
}) {
  try {
    // Extract IP and User Agent from request if available
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      ipAddress =
        req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown";
      userAgent = req.headers["user-agent"] || "unknown";
    }

    return await ActivityLog.log({
      organizationId,
      userId,
      action,
      targetUserId,
      targetEmail,
      metadata,
      changes,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw - logging failure shouldn't break the main operation
    return null;
  }
}

/**
 * Get recent activities for an organization
 * @param {string} organizationId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getRecentActivities(organizationId, limit = 50) {
  return ActivityLog.getRecent(organizationId, limit);
}

/**
 * Get activities by user
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getUserActivities(userId, limit = 50) {
  return ActivityLog.getByUser(userId, limit);
}

/**
 * Format activity for display
 * @param {Object} activity - Activity log entry
 * @returns {Object} Formatted activity
 */
export function formatActivity(activity) {
  const actionMessages = {
    org_created: "created the organization",
    org_updated: "updated organization settings",
    org_deleted: "deleted the organization",
    member_added: "added a new member",
    member_removed: "removed a member",
    member_invited: "invited a new member",
    invitation_accepted: "accepted the invitation",
    invitation_cancelled: "cancelled an invitation",
    role_changed: "changed member role",
    settings_updated: "updated settings",
    webhook_configured: "configured webhook integration",
    webhook_tested: "tested webhook",
    sos_created: "created an SOS alert",
    sos_resolved: "resolved an SOS alert",
    ai_diagnosis: "performed an AI vehicle diagnosis",
  };

  const message = actionMessages[activity.action] || activity.action;

  return {
    id: activity._id,
    message,
    user: activity.user,
    targetUser: activity.targetUser,
    targetEmail: activity.targetEmail,
    metadata: activity.metadata,
    severity: activity.severity,
    timestamp: activity.createdAt,
  };
}
