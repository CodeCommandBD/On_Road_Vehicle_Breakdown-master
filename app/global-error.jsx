"use client";

/**
 * Global Error Handler for Next.js App Router
 * Catches React rendering errors and reports them to Sentry
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#global-errorjs
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#react-render-errors-in-app-router
 */

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Capture the error in Sentry
    Sentry.captureException(error, {
      level: "fatal",
      tags: {
        errorBoundary: "global",
        component: "root",
      },
      contexts: {
        react: {
          componentStack: error.componentStack || "N/A",
        },
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("🔴 [Global Error]:", error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "20px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            backgroundColor: "#f9fafb",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              width: "100%",
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "40px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              textAlign: "center",
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                width: "80px",
                height: "80px",
                margin: "0 auto 24px",
                backgroundColor: "#fee2e2",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            {/* Error Title */}
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#111827",
                marginBottom: "12px",
              }}
            >
              Something went wrong!
            </h1>

            {/* Error Message */}
            <p
              style={{
                fontSize: "16px",
                color: "#6b7280",
                marginBottom: "32px",
                lineHeight: "1.6",
              }}
            >
              We're sorry, but something unexpected happened. Our team has been
              notified and we're working on a fix.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === "development" && error && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "24px",
                  textAlign: "left",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#dc2626",
                    marginBottom: "8px",
                  }}
                >
                  Error Details (Development):
                </p>
                <pre
                  style={{
                    fontSize: "12px",
                    color: "#991b1b",
                    overflow: "auto",
                    maxHeight: "200px",
                    margin: 0,
                  }}
                >
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={reset}
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#1d4ed8")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#2563eb")
                }
              >
                Try Again
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                style={{
                  backgroundColor: "white",
                  color: "#374151",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f9fafb")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "white")
                }
              >
                Go to Homepage
              </button>
            </div>

            {/* Support Link */}
            <p
              style={{
                marginTop: "24px",
                fontSize: "14px",
                color: "#9ca3af",
              }}
            >
              Need help?{" "}
              <a
                href="/contact"
                style={{
                  color: "#2563eb",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
