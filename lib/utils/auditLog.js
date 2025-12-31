/**
 * Audit Logging Utility
 * Centralized logging for all admin and sensitive actions
 */

import ActivityLog from "@/lib/db/models/ActivityLog";

/**
 * Log an action to the audit trail
 * @param {object} params - Logging parameters
 * @param {string} params.action - Action performed (e.g., 'user_created', 'payment_refunded')
 * @param {string} params.performedBy - User ID who performed the action
 * @param {string} params.targetModel - Model name (e.g., 'User', 'Booking', 'Payment')
 * @param {string} params.targetId - ID of the affected document
 * @param {object} params.changes - Object containing before/after values or action details
 * @param {string} params.ipAddress - IP address of the requester
 * @param {string} params.userAgent - User agent string
 * @param {string} params.severity - 'low', 'medium', 'high', 'critical'
 * @returns {Promise<object>} Created activity log
 */
export async function logAction({
  action,
  performedBy,
  targetModel,
  targetId,
  changes = {},
  ipAddress = "unknown",
  userAgent = "unknown",
  severity = "medium",
}) {
  try {
    const log = await ActivityLog.create({
      action,
      performedBy,
      targetModel,
      targetId,
      changes,
      ipAddress,
      userAgent,
      severity,
      timestamp: new Date(),
    });

    console.log(`📝 Audit Log: ${action} by ${performedBy || "system"}`);
    return log;
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - logging failure shouldn't break the main operation
    return null;
  }
}

/**
 * Extract IP address from request
 * @param {Request} request - Next.js request object
 * @returns {string} IP address
 */
export function getIPAddress(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") || // Cloudflare
    "unknown"
  );
}

/**
 * Extract user agent from request
 * @param {Request} request - Next.js request object
 * @returns {string} User agent
 */
export function getUserAgent(request) {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Create audit log from request context
 * @param {Request} request - Next.js request object
 * @param {object} logData - Additional log data
 * @returns {Promise<object>} Created activity log
 */
export async function logFromRequest(request, logData) {
  return logAction({
    ...logData,
    ipAddress: getIPAddress(request),
    userAgent: getUserAgent(request),
  });
}

/**
 * Pre-defined audit actions for consistency
 */
export const AUDIT_ACTIONS = {
  // User Management
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",
  USER_ROLE_CHANGED: "user_role_changed",
  USER_SUSPENDED: "user_suspended",
  USER_ACTIVATED: "user_activated",

  // Booking Management
  BOOKING_CREATED: "booking_created",
  BOOKING_UPDATED: "booking_updated",
  BOOKING_CANCELLED: "booking_cancelled",
  BOOKING_STATUS_CHANGED: "booking_status_changed",
  BOOKING_ASSIGNED: "booking_assigned",

  // Payment & Financial
  PAYMENT_INITIATED: "payment_initiated",
  PAYMENT_COMPLETED: "payment_completed",
  PAYMENT_FAILED: "payment_failed",
  PAYMENT_REFUNDED: "payment_refunded",
  PAYMENT_FRAUD_ATTEMPT: "payment_fraud_attempt",

  // Garage Management
  GARAGE_CREATED: "garage_created",
  GARAGE_UPDATED: "garage_updated",
  GARAGE_VERIFIED: "garage_verified",
  GARAGE_SUSPENDED: "garage_suspended",

  // Subscription & Plans
  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
  PLAN_CREATED: "plan_created",
  PLAN_UPDATED: "plan_updated",

  // Coupon & Discounts
  COUPON_CREATED: "coupon_created",
  COUPON_USED: "coupon_used",
  COUPON_DELETED: "coupon_deleted",

  // Security
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILED: "login_failed",
  PASSWORD_CHANGED: "password_changed",
  PASSWORD_RESET: "password_reset",

  // System
  SETTINGS_UPDATED: "settings_updated",
  BACKUP_CREATED: "backup_created",
  DATA_EXPORTED: "data_exported",
};

/**
 * Severity levels
 */
export const SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};
