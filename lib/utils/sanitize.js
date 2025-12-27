/**
 * Input Sanitization Utilities
 * Prevents XSS and injection attacks
 */

/**
 * Sanitize string input to prevent XSS attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== "string") return input;

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
export function sanitizeObject(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Remove dangerous HTML tags and scripts
 * @param {string} html - HTML string
 * @returns {string} - Clean HTML
 */
export function stripDangerousHTML(html) {
  if (typeof html !== "string") return html;

  // Remove script tags and their content
  let clean = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

  // Remove event handlers
  clean = clean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  clean = clean.replace(/on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: protocol
  clean = clean.replace(/javascript:/gi, "");

  // Remove data: protocol (can be used for XSS)
  clean = clean.replace(/data:text\/html/gi, "");

  return clean;
}

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
export function sanitizeEmail(email) {
  if (typeof email !== "string") return null;

  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize phone number (Bangladesh format)
 * @param {string} phone - Phone number
 * @returns {string|null} - Sanitized phone or null if invalid
 */
export function sanitizePhone(phone) {
  if (typeof phone !== "string") return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Bangladesh phone format: 01XXXXXXXXX (11 digits)
  // Or with country code: 8801XXXXXXXXX (13 digits)
  if (digits.length === 11 && digits.startsWith("01")) {
    return digits;
  }

  if (digits.length === 13 && digits.startsWith("880")) {
    return digits.substring(2); // Remove country code
  }

  if (digits.length === 14 && digits.startsWith("+880")) {
    return digits.substring(3); // Remove +880
  }

  return null;
}

/**
 * Sanitize MongoDB query to prevent NoSQL injection
 * @param {Object} query - MongoDB query object
 * @returns {Object} - Sanitized query
 */
export function sanitizeMongoQuery(query) {
  if (typeof query !== "object" || query === null) {
    return query;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(query)) {
    // Prevent $where and other dangerous operators
    if (
      key.startsWith("$") &&
      !["$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin"].includes(key)
    ) {
      continue; // Skip dangerous operators
    }

    if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize URL to prevent open redirect attacks
 * @param {string} url - URL to sanitize
 * @param {string[]} allowedDomains - List of allowed domains
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export function sanitizeURL(url, allowedDomains = []) {
  if (typeof url !== "string") return null;

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    // Check if domain is allowed
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some((domain) =>
        parsed.hostname.endsWith(domain)
      );
      if (!isAllowed) {
        return null;
      }
    }

    return parsed.toString();
  } catch (error) {
    return null;
  }
}

/**
 * Sanitize filename to prevent path traversal
 * @param {string} filename - Filename to sanitize
 * @returns {string} - Safe filename
 */
export function sanitizeFilename(filename) {
  if (typeof filename !== "string") return "file";

  // Remove path separators and null bytes
  let safe = filename.replace(/[\/\\]/g, "_");
  safe = safe.replace(/\0/g, "");

  // Remove leading dots to prevent hidden files
  safe = safe.replace(/^\.+/, "");

  // Limit length
  if (safe.length > 255) {
    safe = safe.substring(0, 255);
  }

  return safe || "file";
}

/**
 * Comprehensive input sanitization for API requests
 * @param {Object} data - Request data
 * @returns {Object} - Sanitized data
 */
export function sanitizeInput(data) {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip password fields (they should be hashed, not sanitized)
    if (key.toLowerCase().includes("password")) {
      sanitized[key] = value;
      continue;
    }

    // Sanitize based on key name
    if (key.toLowerCase().includes("email")) {
      sanitized[key] = sanitizeEmail(value);
    } else if (key.toLowerCase().includes("phone")) {
      sanitized[key] = sanitizePhone(value);
    } else if (
      key.toLowerCase().includes("url") ||
      key.toLowerCase().includes("link")
    ) {
      sanitized[key] = sanitizeURL(value);
    } else if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
