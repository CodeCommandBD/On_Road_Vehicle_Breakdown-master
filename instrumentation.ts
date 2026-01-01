/**
 * Instrumentation file for Next.js
 * Handles Sentry initialization and error tracking
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * onRequestError hook for Next.js 15+
 * Captures errors from nested React Server Components
 * This is required for proper Sentry error tracking in Next.js 15
 *
 * @param err - The error that occurred
 * @param request - The incoming request object
 * @param context - Additional context about the error
 */
export async function onRequestError(
  err: unknown,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    renderSource:
      | "react-server-components"
      | "react-server-components-payload"
      | "server-rendering";
    revalidateReason?: "on-demand" | "stale";
    renderType?: "dynamic" | "dynamic-resume";
  }
) {
  // Only capture errors in server runtime
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");

    // Capture the error with full context
    Sentry.captureException(err, {
      contexts: {
        nextjs: {
          request_path: request.path,
          request_method: request.method,
          router_kind: context.routerKind,
          route_path: context.routePath,
          route_type: context.routeType,
          render_source: context.renderSource,
          revalidate_reason: context.revalidateReason,
          render_type: context.renderType,
        },
      },
      tags: {
        "nextjs.runtime": process.env.NEXT_RUNTIME,
        "nextjs.route_type": context.routeType,
        "nextjs.router_kind": context.routerKind,
      },
      level: "error",
    });

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("🔴 [Sentry] Request Error Captured:", {
        error: err,
        path: request.path,
        method: request.method,
        routeType: context.routeType,
        routePath: context.routePath,
      });
    }
  }
}
