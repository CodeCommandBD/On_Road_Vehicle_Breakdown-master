/**
 * Security Headers Configuration
 * Provides security headers for Next.js application
 *
 * Note: For full Helmet.js functionality, you need to install it:
 * npm install helmet
 *
 * This is a Next.js compatible version using next.config.js headers
 */

/**
 * Security headers to add to next.config.js
 * Add these to your next.config.js file:
 *
 * module.exports = {
 *   async headers() {
 *     return [
 *       {
 *         source: '/:path*',
 *         headers: securityHeaders,
 *       },
 *     ]
 *   },
 * }
 */

export const securityHeaders = [
  // Prevent clickjacking attacks
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Prevent MIME type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Enable XSS protection
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // Referrer policy
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Permissions policy (formerly Feature-Policy)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  // Content Security Policy (CSP)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.sslcommerz.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  // Strict Transport Security (HTTPS only)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

/**
 * Development security headers (less strict)
 */
export const devSecurityHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "no-referrer-when-downgrade",
  },
];

/**
 * Get security headers based on environment
 */
export function getSecurityHeaders() {
  return process.env.NODE_ENV === "production"
    ? securityHeaders
    : devSecurityHeaders;
}

/**
 * CORS Configuration
 */
export const corsConfig = {
  // Allowed origins
  allowedOrigins:
    process.env.NODE_ENV === "production"
      ? ["https://yourdomain.com", "https://www.yourdomain.com"]
      : ["http://localhost:3000", "http://localhost:3001"],

  // Allowed methods
  allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  // Allowed headers
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],

  // Exposed headers
  exposedHeaders: [
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ],

  // Credentials
  credentials: true,

  // Max age for preflight cache
  maxAge: 86400, // 24 hours
};

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(request, response) {
  const origin = request.headers.get("origin");

  // Check if origin is allowed
  if (origin && corsConfig.allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    corsConfig.allowedMethods.join(", ")
  );

  response.headers.set(
    "Access-Control-Allow-Headers",
    corsConfig.allowedHeaders.join(", ")
  );

  response.headers.set(
    "Access-Control-Expose-Headers",
    corsConfig.exposedHeaders.join(", ")
  );

  if (corsConfig.credentials) {
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  response.headers.set("Access-Control-Max-Age", corsConfig.maxAge.toString());

  return response;
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(request) {
  const origin = request.headers.get("origin");

  if (!origin || !corsConfig.allowedOrigins.includes(origin)) {
    return new Response(null, { status: 403 });
  }

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set(
    "Access-Control-Allow-Methods",
    corsConfig.allowedMethods.join(", ")
  );
  headers.set(
    "Access-Control-Allow-Headers",
    corsConfig.allowedHeaders.join(", ")
  );
  headers.set("Access-Control-Max-Age", corsConfig.maxAge.toString());

  if (corsConfig.credentials) {
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}
