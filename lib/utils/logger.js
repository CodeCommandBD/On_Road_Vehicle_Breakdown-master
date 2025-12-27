/**
 * Simple Logger Utility
 * Provides structured logging with different levels
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const CURRENT_LOG_LEVEL =
  process.env.NODE_ENV === "production" ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

/**
 * Format log message with timestamp and level
 */
function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : "";

  return `[${timestamp}] [${level}] ${message} ${metaString}`;
}

/**
 * Log error message
 */
export function logError(message, error = null, meta = {}) {
  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
    const errorMeta = error
      ? {
          ...meta,
          error: error.message,
          stack: error.stack,
        }
      : meta;

    console.error(formatMessage("ERROR", message, errorMeta));
  }
}

/**
 * Log warning message
 */
export function logWarn(message, meta = {}) {
  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
    console.warn(formatMessage("WARN", message, meta));
  }
}

/**
 * Log info message
 */
export function logInfo(message, meta = {}) {
  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
    console.log(formatMessage("INFO", message, meta));
  }
}

/**
 * Log debug message (only in development)
 */
export function logDebug(message, meta = {}) {
  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
    console.log(formatMessage("DEBUG", message, meta));
  }
}

/**
 * Log API request
 */
export function logRequest(method, path, userId = null, meta = {}) {
  logInfo(`${method} ${path}`, {
    userId,
    ...meta,
  });
}

/**
 * Log API response
 */
export function logResponse(method, path, statusCode, duration, meta = {}) {
  const level = statusCode >= 400 ? "WARN" : "INFO";
  const message = `${method} ${path} ${statusCode} in ${duration}ms`;

  if (level === "WARN") {
    logWarn(message, meta);
  } else {
    logInfo(message, meta);
  }
}

/**
 * Log database query
 */
export function logQuery(collection, operation, duration, meta = {}) {
  logDebug(`DB Query: ${collection}.${operation}`, {
    duration: `${duration}ms`,
    ...meta,
  });
}

/**
 * Log authentication event
 */
export function logAuth(event, userId, success, meta = {}) {
  const message = `Auth: ${event} - ${success ? "SUCCESS" : "FAILED"}`;

  if (success) {
    logInfo(message, { userId, ...meta });
  } else {
    logWarn(message, { userId, ...meta });
  }
}

/**
 * Create a logger instance for a specific module
 */
export function createLogger(moduleName) {
  return {
    error: (message, error, meta) =>
      logError(`[${moduleName}] ${message}`, error, meta),
    warn: (message, meta) => logWarn(`[${moduleName}] ${message}`, meta),
    info: (message, meta) => logInfo(`[${moduleName}] ${message}`, meta),
    debug: (message, meta) => logDebug(`[${moduleName}] ${message}`, meta),
  };
}

// Export default logger
export default {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
  request: logRequest,
  response: logResponse,
  query: logQuery,
  auth: logAuth,
  createLogger,
};
