/**
 * Sentry Edge Runtime Configuration
 * Handles error tracking for edge features (middleware, edge routes)
 * Note: This config is unrelated to the Vercel Edge Runtime and is also required when running locally.
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

  // Enable performance monitoring
  enableTracing: true,

  // Ignore specific errors
  ignoreErrors: [
    // Network errors
    "NetworkError",
    "Network request failed",
    "Failed to fetch",
    // Abort errors
    "AbortError",
    "The operation was aborted",
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

    // Add edge runtime context
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: "Edge",
        type: "edge",
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
    if (breadcrumb.data?.url) {
      breadcrumb.data.url = breadcrumb.data.url.replace(
        /token=[^&]*/gi,
        "token=[REDACTED]"
      );
    }

    return breadcrumb;
  },

  // Custom tags for filtering in Sentry dashboard
  initialScope: {
    tags: {
      runtime: "edge",
      "nextjs.version": "15",
    },
  },
});

// Export Sentry for use in edge routes
export { Sentry };
