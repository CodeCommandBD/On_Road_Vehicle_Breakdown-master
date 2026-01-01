/**
 * Sentry Client-Side Instrumentation
 * Handles error tracking for browser runtime (Client Components, User Interactions)
 * This file replaces the deprecated sentry.client.config.js for Turbopack compatibility
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from "@sentry/nextjs";

export function register() {
  Sentry.init({
    // Your Sentry DSN
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: process.env.NODE_ENV === "development",

    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps

    // Environment
    environment: process.env.NODE_ENV || "development",

    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      // Random plugins/extensions
      "originalCreateNotification",
      "canvas.contentDocument",
      "MyApp_RemoveAllHighlights",
      // Facebook borked
      "fb_xd_fragment",
      // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to reduce this. (thanks @acdha)
      // See http://stackoverflow.com/questions/4113268/how-to-stop-javascript-injection-from-vodafone-proxy
      "bmi_SafeAddOnload",
      "EBCallBackMessageReceived",
      // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
      "conduitPage",
      // Network errors
      "NetworkError",
      "Network request failed",
      "Failed to fetch",
      // Abort errors
      "AbortError",
      "The operation was aborted",
      // ResizeObserver errors (non-critical)
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      // Hydration errors (handled by React)
      "Hydration failed",
      "There was an error while hydrating",
    ],

    // Filter out localhost and development URLs
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      // Firefox extensions
      /^moz-extension:\/\//i,
      // Safari extensions
      /^safari-extension:\/\//i,
      // Edge extensions
      /^edge:\/\//i,
    ],

    // Before sending to Sentry, filter sensitive data
    beforeSend(event, hint) {
      // Don't send events if DSN is not configured
      if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
        return null;
      }

      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;

        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers["authorization"];
          delete event.request.headers["cookie"];
          delete event.request.headers["x-api-key"];
        }

        // Sanitize URLs
        if (event.request.url) {
          event.request.url = event.request.url.replace(
            /token=[^&]*/gi,
            "token=[REDACTED]"
          );
        }
      }

      // Add browser context
      event.contexts = {
        ...event.contexts,
        browser: {
          name: navigator?.userAgent || "Unknown",
          online: navigator?.onLine,
          language: navigator?.language,
        },
      };

      return event;
    },

    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter out noisy console logs
      if (breadcrumb.category === "console" && breadcrumb.level === "log") {
        return null;
      }

      // Sanitize URLs in breadcrumbs
      if (breadcrumb.data?.url) {
        breadcrumb.data.url = breadcrumb.data.url.replace(
          /token=[^&]*/gi,
          "token=[REDACTED]"
        );
      }

      // Filter out sensitive input values
      if (breadcrumb.category === "ui.input") {
        if (breadcrumb.message?.includes("password")) {
          breadcrumb.message = "[REDACTED]";
        }
      }

      return breadcrumb;
    },

    // Integrations are now auto-instrumented by default in @sentry/nextjs
    // Browser tracing and session replay are automatically enabled when enableTracing is true
    // The SDK will automatically instrument page loads, navigation, and user interactions

    // Custom tags for filtering in Sentry dashboard
    initialScope: {
      tags: {
        runtime: "browser",
        "nextjs.version": "15",
      },
    },
  });

  // Set user context when available
  if (typeof window !== "undefined") {
    // Try to get user from localStorage or session
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        Sentry.setUser({
          id: user.id || user._id,
          email: user.email,
          username: user.name,
        });
      }
    } catch (error) {
      // Ignore errors in getting user context
    }
  }
}

// Export Sentry for use in components
export { Sentry };

// Required export for Sentry router instrumentation
// This enables automatic tracking of Next.js router transitions
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
