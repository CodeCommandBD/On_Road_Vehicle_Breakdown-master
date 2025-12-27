/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and API abuse
 */

import { NextResponse } from "next/server";

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map();

/**
 * Clean up old entries every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 0) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter function
 * @param {string} identifier - Unique identifier (IP, user ID, etc.)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} - { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(identifier, maxRequests = 5, windowMs = 60000) {
  const now = Date.now();
  const key = identifier;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  const data = rateLimitStore.get(key);

  // Reset if window has passed
  if (now > data.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  // Increment count
  data.count++;

  if (data.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: data.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - data.count,
    resetTime: data.resetTime,
  };
}

/**
 * Rate limit middleware for API routes
 * @param {Request} request - Next.js request object
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {NextResponse|null} - Error response if rate limited, null if allowed
 */
export function rateLimitMiddleware(
  request,
  maxRequests = 10,
  windowMs = 60000
) {
  // Get identifier (IP address or user ID from token)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : request.headers.get("x-real-ip") || "unknown";

  const identifier = ip;

  const { allowed, remaining, resetTime } = checkRateLimit(
    identifier,
    maxRequests,
    windowMs
  );

  if (!allowed) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

    return NextResponse.json(
      {
        success: false,
        message: "অনেক বেশি অনুরোধ। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।",
        retryAfter: retryAfter,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(resetTime).toISOString(),
          "Retry-After": retryAfter.toString(),
        },
      }
    );
  }

  // Add rate limit headers to response (will be added by the route)
  return null; // Allowed
}

/**
 * Get rate limit headers to add to successful responses
 */
export function getRateLimitHeaders(
  identifier,
  maxRequests = 10,
  windowMs = 60000
) {
  const data = rateLimitStore.get(identifier);

  if (!data) {
    return {
      "X-RateLimit-Limit": maxRequests.toString(),
      "X-RateLimit-Remaining": maxRequests.toString(),
      "X-RateLimit-Reset": new Date(Date.now() + windowMs).toISOString(),
    };
  }

  return {
    "X-RateLimit-Limit": maxRequests.toString(),
    "X-RateLimit-Remaining": Math.max(0, maxRequests - data.count).toString(),
    "X-RateLimit-Reset": new Date(data.resetTime).toISOString(),
  };
}

/**
 * Strict rate limiter for sensitive routes (login, signup)
 */
export function strictRateLimit(request) {
  return rateLimitMiddleware(request, 5, 15 * 60 * 1000); // 5 requests per 15 minutes
}

/**
 * Normal rate limiter for general API routes
 */
export function normalRateLimit(request) {
  return rateLimitMiddleware(request, 100, 60 * 1000); // 100 requests per minute
}
