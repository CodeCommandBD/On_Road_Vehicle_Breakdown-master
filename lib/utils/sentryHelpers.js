/**
 * Sentry Utility Functions
 * Helper functions for error tracking and monitoring across the application
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Capture an exception with additional context
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 * @param {string} context.userId - User ID
 * @param {string} context.route - API route or page
 * @param {Object} context.metadata - Additional metadata
 * @param {string} context.level - Error level (error, warning, info)
 */
export function captureError(error, context = {}) {
  const { userId, route, metadata = {}, level = "error" } = context;

  Sentry.captureException(error, {
    level,
    tags: {
      route: route || "unknown",
      ...(userId && { userId }),
    },
    extra: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
    user: userId
      ? {
          id: userId,
        }
      : undefined,
  });

  // Also log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("🔴 [Sentry Error Captured]:", {
      error: error.message,
      stack: error.stack,
      context,
    });
  }
}

/**
 * Capture a message (non-error event)
 * @param {string} message - The message to capture
 * @param {Object} context - Additional context
 * @param {string} context.level - Message level (info, warning, error)
 * @param {Object} context.metadata - Additional metadata
 */
export function captureMessage(message, context = {}) {
  const { level = "info", metadata = {} } = context;

  Sentry.captureMessage(message, {
    level,
    extra: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  });

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`📝 [Sentry Message]: ${message}`, metadata);
  }
}

/**
 * Set user context for error tracking
 * @param {Object} user - User object
 * @param {string} user.id - User ID
 * @param {string} user.email - User email
 * @param {string} user.name - User name
 * @param {string} user.role - User role
 */
export function setUserContext(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id || user._id?.toString(),
    email: user.email,
    username: user.name,
    role: user.role,
  });
}

/**
 * Add breadcrumb for debugging
 * @param {Object} breadcrumb - Breadcrumb data
 * @param {string} breadcrumb.message - Breadcrumb message
 * @param {string} breadcrumb.category - Category (e.g., 'auth', 'payment', 'booking')
 * @param {string} breadcrumb.level - Level (info, warning, error)
 * @param {Object} breadcrumb.data - Additional data
 */
export function addBreadcrumb(breadcrumb) {
  const {
    message,
    category = "custom",
    level = "info",
    data = {},
  } = breadcrumb;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data: {
      ...data,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Start a transaction for performance monitoring
 * @param {string} name - Transaction name
 * @param {string} op - Operation type (e.g., 'http.server', 'db.query')
 * @returns {Transaction} Sentry transaction
 */
export function startTransaction(name, op = "custom") {
  return Sentry.startTransaction({
    name,
    op,
    tags: {
      environment: process.env.NODE_ENV,
    },
  });
}

/**
 * Wrap an async function with error tracking
 * @param {Function} fn - Async function to wrap
 * @param {Object} context - Context for error tracking
 * @returns {Function} Wrapped function
 */
export function withErrorTracking(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error, context);
      throw error;
    }
  };
}

/**
 * Track API route execution with Sentry
 * @param {string} routeName - Name of the API route
 * @param {Function} handler - Route handler function
 * @returns {Function} Wrapped handler
 */
export function trackAPIRoute(routeName, handler) {
  return async (request, ...args) => {
    const transaction = startTransaction(routeName, "http.server");

    try {
      // Add request context
      addBreadcrumb({
        message: `API Request: ${routeName}`,
        category: "api",
        level: "info",
        data: {
          method: request.method,
          url: request.url,
        },
      });

      const result = await handler(request, ...args);
      transaction.setStatus("ok");
      return result;
    } catch (error) {
      transaction.setStatus("internal_error");
      captureError(error, {
        route: routeName,
        metadata: {
          method: request.method,
          url: request.url,
        },
      });
      throw error;
    } finally {
      transaction.finish();
    }
  };
}

/**
 * Track database operations with Sentry
 * @param {string} operation - Database operation name
 * @param {Function} fn - Database operation function
 * @returns {Promise} Result of the operation
 */
export async function trackDBOperation(operation, fn) {
  const span = Sentry.getCurrentHub().getScope().getTransaction()?.startChild({
    op: "db.query",
    description: operation,
  });

  try {
    const result = await fn();
    span?.setStatus("ok");
    return result;
  } catch (error) {
    span?.setStatus("internal_error");
    captureError(error, {
      route: "database",
      metadata: {
        operation,
      },
    });
    throw error;
  } finally {
    span?.finish();
  }
}

/**
 * Flush Sentry events (useful before serverless function termination)
 * @param {number} timeout - Timeout in milliseconds (default: 2000)
 * @returns {Promise<boolean>} Whether flush was successful
 */
export async function flushSentry(timeout = 2000) {
  try {
    await Sentry.flush(timeout);
    return true;
  } catch (error) {
    console.error("Failed to flush Sentry events:", error);
    return false;
  }
}

/**
 * Check if Sentry is properly configured
 * @returns {boolean} Whether Sentry is configured
 */
export function isSentryConfigured() {
  return !!process.env.NEXT_PUBLIC_SENTRY_DSN;
}

// Export Sentry instance for advanced usage
export { Sentry };
