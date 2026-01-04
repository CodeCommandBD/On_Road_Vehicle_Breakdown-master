# ⚡ Performance Optimization Guide

This guide outlines the strategies and configurations used to ensure high performance for the **On-Road Vehicle Breakdown** platform.

## Table of Contents

- [Image Optimization](#image-optimization)
- [Code Optimization](#code-optimization)
- [Caching Strategy](#caching-strategy)
- [Database Performance](#database-performance)
- [Measuring Performance](#measuring-performance)

---

## Image Optimization

We use `next/image` and Cloudinary for optimal image delivery.

### Best Practices

- **Use WebP/AVIF**: All static assets in `public/` are converted to WebP.
- **Lazy Loading**: Images below the fold are lazy-loaded automatically by `next/image`.
- **Dimensions**: Always specific `width` and `height` props to prevent Cumulative Layout Shift (CLS).
- **Cloudinary w_auto**: For dynamic user uploads, we use Cloudinary transformation URLs to serve the correct size.

```jsx
// Example
<CldImage
  width="500"
  height="500"
  src={publicId}
  alt="Description"
  loading="lazy"
/>
```

---

## Code Optimization

### Dynamic Imports (Code Splitting)

Heavy components are imported dynamically to reduce the initial bundle size.

```jsx
const MapComponent = dynamic(() => import("@/components/map/Map"), {
  ssr: false, // Map requires window object
  loading: () => <MapSkeleton />,
});
```

### Tree Shaking

We import specific icons instead of entire libraries to enable tree shaking.

```jsx
// Good
import { Car } from "lucide-react";

// Avoid
// import * as Icons from 'lucide-react';
```

---

## Caching Strategy

### 1. Request Memoization (Next.js)

Multiple fetch calls for the same data in a single render pass are automatically deduplicated.

### 2. Data Cache (Server)

Fetch requests are cached persistently across requests.

```js
fetch("https://api...", { next: { revalidate: 3600 } }); // Cache for 1 hour
```

### 3. Redis Caching

We use Redis (Upstash) for:

- **Session Data**: Fast authentication checks.
- **Rate Limiting**: Preventing API abuse without hitting the DB.
- **User Preferences**: Frequently accessed settings.

---

## Database Performance

### Indexing

Ensure these fields are indexed in MongoDB:

- `email` (Unique)
- `location` (2dsphere for geospatial queries)
- `bookingNumber` (Unique)
- `status` (For filtering)

### Projection

Always select only the fields you need.

```js
await User.findById(id).select("name email avatar"); // Faster than fetching full document
```

### Connection Pooling

Mongoose manages connection pooling, but ensure your `lib/db/connection.js` reuses the cached connection in serverless environments (Vercel).

---

## Measuring Performance

### Tools

- **Core Web Vitals**: Monitor LCP, FID, and CLS in Vercel Analytics.
- **Lighthouse**: Run audits in Chrome DevTools.
- **Bundle Analyzer**: Use `@next/bundle-analyzer` to visualize bundle size.

```bash
ANALYZE=true npm run build
```

---

[← Back to README](../README.md)
