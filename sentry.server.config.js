/**
 * Sentry Server-Side Configuration
 * Handles error tracking for Node.js runtime (API routes, Server Components)
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Your Sentry DSN
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Release tracking (optional - set via SENTRY_RELEASE env var)
  // release: process.env.SENTRY_RELEASE,

  // Enable performance monitoring
  enableTracing: true,

  // Profile sample rate for performance profiling
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Ignore specific errors that are not actionable
  ignoreErrors: [
    // Network errors
    "NetworkError",
    "Network request failed",
    "Failed to fetch",
    // Abort errors
    "AbortError",
    "The operation was aborted",
    // MongoDB connection timeouts (handled by retry logic)
    "MongoServerSelectionError",
    // Rate limit errors (expected behavior)
    "Too Many Requests",
  ],

  // Filter out sensitive data before sending
  beforeSend(event, hint) {
    // Don't send events if DSN is not configured
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null;
    }

    // Filter out sensitive request data
    if (event.request) {
      // Remove cookies
      delete event.request.cookies;

      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
        delete event.request.headers["x-api-key"];
      }

      // Sanitize query parameters
      if (event.request.query_string) {
        event.request.query_string = event.request.query_string.replace(
          /token=[^&]*/gi,
          "token=[REDACTED]"
        );
      }
    }

    // Add custom context
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: "Node.js",
        version: process.version,
      },
    };

    return event;
  },

  // Breadcrumbs for better debugging
  beforeBreadcrumb(breadcrumb, hint) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === "console" && breadcrumb.level === "log") {
      return null;
    }

    // Sanitize breadcrumb data
    if (breadcrumb.data) {
      if (breadcrumb.data.url) {
        breadcrumb.data.url = breadcrumb.data.url.replace(
          /token=[^&]*/gi,
          "token=[REDACTED]"
        );
      }
    }

    return breadcrumb;
  },

  // Integrations are now auto-instrumented by default in @sentry/nextjs
  // HTTP and database calls are automatically tracked when enableTracing is true
  // No need to manually configure Http or Mongo integrations

  // Custom tags for filtering in Sentry dashboard
  initialScope: {
    tags: {
      runtime: "server",
      "nextjs.version": "15",
    },
  },
});

// Export Sentry for use in API routes
export { Sentry };
