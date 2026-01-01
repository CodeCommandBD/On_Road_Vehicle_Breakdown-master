/**
 * CSRF Protection Utility
 * Generates and validates CSRF tokens to prevent Cross-Site Request Forgery attacks
 */

import { randomBytes, createHmac } from "crypto";

const CSRF_SECRET =
  process.env.CSRF_SECRET ||
  process.env.JWT_SECRET ||
  "default-csrf-secret-change-in-production";
const TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token
 * @returns {string} CSRF token
 */
export function generateCsrfToken() {
  const token = randomBytes(TOKEN_LENGTH).toString("hex");
  const timestamp = Date.now();
  const signature = createHmac("sha256", CSRF_SECRET)
    .update(`${token}:${timestamp}`)
    .digest("hex");

  return `${token}:${timestamp}:${signature}`;
}

/**
 * Validate a CSRF token
 * @param {string} token - CSRF token to validate
 * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
 * @returns {boolean} True if valid, false otherwise
 */
export function validateCsrfToken(token, maxAge = 60 * 60 * 1000) {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(":");
  if (parts.length !== 3) {
    return false;
  }

  const [tokenValue, timestamp, signature] = parts;

  // Check if token is expired
  const now = Date.now();
  const tokenAge = now - parseInt(timestamp, 10);
  if (tokenAge > maxAge || tokenAge < 0) {
    return false;
  }

  // Verify signature
  const expectedSignature = createHmac("sha256", CSRF_SECRET)
    .update(`${tokenValue}:${timestamp}`)
    .digest("hex");

  return signature === expectedSignature;
}

/**
 * CSRF middleware for API routes
 * Validates CSRF token for state-changing operations (POST, PUT, DELETE)
 * @param {Request} request - Next.js request object
 * @returns {Object|null} Error response if invalid, null if valid
 */
export function csrfProtection(request) {
  const method = request.method;

  // Only check CSRF for state-changing methods
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return null; // GET requests don't need CSRF protection
  }

  // Skip CSRF for certain routes (like login, signup)
  const url = new URL(request.url);
  const skipRoutes = [
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/payments/success",
    "/api/payments/fail",
    "/api/payments/cancel",
    "/api/payments/ipn",
    "/api/webhooks",
  ];

  if (skipRoutes.some((route) => url.pathname.startsWith(route))) {
    return null; // Skip CSRF for these routes
  }

  // Get CSRF token from header
  const csrfToken = request.headers.get("x-csrf-token");

  if (!csrfToken) {
    return {
      error: true,
      status: 403,
      message: "CSRF token missing",
    };
  }

  // Validate token
  const isValid = validateCsrfToken(csrfToken);

  if (!isValid) {
    return {
      error: true,
      status: 403,
      message: "Invalid or expired CSRF token",
    };
  }

  return null; // Valid
}

export default {
  generateCsrfToken,
  validateCsrfToken,
  csrfProtection,
};
