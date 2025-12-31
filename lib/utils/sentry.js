/**
 * Sentry Error Tracking Utility
 *
 * Provides helper functions for error tracking and user context
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Set user context for error tracking
 * Call this after user login
 */
export function setUserContext(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user._id || user.id,
    email: user.email,
    username: user.name,
    role: user.role,
  });
}

/**
 * Clear user context
 * Call this on logout
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Log custom error with context
 */
export function logError(error, context = {}) {
  Sentry.captureException(error, {
    tags: context.tags || {},
    extra: context.extra || {},
    level: context.level || "error",
  });
}

/**
 * Log custom message
 */
export function logMessage(message, level = "info", context = {}) {
  Sentry.captureMessage(message, {
    level,
    tags: context.tags || {},
    extra: context.extra || {},
  });
}

/**
 * Add breadcrumb (user action tracking)
 */
export function addBreadcrumb(message, category = "user-action", data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}

/**
 * Set custom tag
 */
export function setTag(key, value) {
  Sentry.setTag(key, value);
}

/**
 * Set custom context
 */
export function setContext(name, context) {
  Sentry.setContext(name, context);
}

/**
 * Wrap async function with error tracking
 */
export function withErrorTracking(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      throw error;
    }
  };
}
