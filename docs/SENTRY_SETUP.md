# 🐛 Sentry Setup Guide

This guide explains how to set up **Sentry** for real-time error tracking and performance monitoring in the **On-Road Vehicle Breakdown** platform.

## 1. Create Sentry Project

1. Log in to [Sentry.io](https://sentry.io).
2. Create a new project.
3. Choose **Next.js** as the platform.
4. Copy your **DSN** (Data Source Name).

## 2. Configuration

### Environment Variables

Add the DSN to your `.env.local` and production environment variables:

```env
NEXT_PUBLIC_SENTRY_DSN=your_dsn_here
SENTRY_AUTH_TOKEN=your_auth_token_here
```

### Next.js Config

Ensure `next.config.mjs` wraps the config with Sentry:

```javascript
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // ... existing config
};

export default withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: "your-org-slug",
    project: "your-project-slug",
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
  }
);
```

## 3. Usage

### Capturing Errors

Sentry automatically captures unhandled exceptions. To manually capture errors:

```javascript
import * as Sentry from "@sentry/nextjs";

try {
  // Risky code
} catch (error) {
  Sentry.captureException(error);
}
```

### Performance Monitoring

Sentry automatically instruments API routes and page loads. You can view transaction traces in the Sentry dashboard to identify slow queries or API calls.

## 4. Verification

1. Run the app locally (`npm run dev`).
2. Trigger a test error (e.g., throw a new Error in a component).
3. Check your Sentry dashboard to see if the issue appears.

---

[← Back to README](../README.md)
