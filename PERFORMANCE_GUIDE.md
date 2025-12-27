# Performance Optimization Guide

## 🚀 Implemented Optimizations

### 1. Database Optimizations ✅

- **Indexes**: All models have proper indexes
  - User: email, role, location (2dsphere)
  - Garage: location (2dsphere), rating, isActive, isVerified
  - Booking: user, garage, status, createdAt, location (2dsphere)

### 2. API Response Optimization ✅

- **Pagination**: Implemented in admin routes and can be added to all list endpoints
- **Field Selection**: Use `.select()` to fetch only needed fields
- **Population**: Selective population with field limits

### 3. Validation & Sanitization ✅

- **Zod Schemas**: Fast validation before database operations
- **Input Sanitization**: Prevents unnecessary database queries with invalid data

---

## 📋 Recommended Future Optimizations

### 1. Redis Caching

**Install Redis:**

```bash
npm install redis ioredis
```

**Cache Strategy:**

```javascript
// lib/utils/cache.js
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export async function getCached(key, fetchFn, ttl = 300) {
  // Check cache first
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Fetch from database
  const data = await fetchFn();

  // Store in cache
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
}
```

**Use Cases:**

- User profile data (TTL: 5 minutes)
- Garage listings (TTL: 10 minutes)
- Service lists (TTL: 1 hour)
- Statistics (TTL: 5 minutes)

### 2. Database Query Optimization

**Use Lean Queries:**

```javascript
// Instead of:
const users = await User.find();

// Use:
const users = await User.find().lean(); // Returns plain JS objects (faster)
```

**Batch Operations:**

```javascript
// Instead of multiple queries:
for (const id of userIds) {
  await User.findById(id);
}

// Use single query:
const users = await User.find({ _id: { $in: userIds } });
```

**Aggregation Pipeline:**

```javascript
// For complex queries, use aggregation:
const stats = await Booking.aggregate([
  { $match: { status: "completed" } },
  {
    $group: {
      _id: "$garage",
      totalRevenue: { $sum: "$actualCost" },
      count: { $sum: 1 },
    },
  },
]);
```

### 3. Image Optimization

**Use Next.js Image Component:**

```javascript
import Image from "next/image";

<Image
  src="/garage-image.jpg"
  alt="Garage"
  width={500}
  height={300}
  loading="lazy"
  quality={75}
/>;
```

**Cloudinary Integration:**

```javascript
// Auto-optimize images
const optimizedUrl = cloudinary.url("image.jpg", {
  transformation: [
    { width: 500, crop: "scale" },
    { quality: "auto" },
    { fetch_format: "auto" },
  ],
});
```

### 4. Code Splitting & Lazy Loading

**Dynamic Imports:**

```javascript
// Instead of:
import HeavyComponent from "./HeavyComponent";

// Use:
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <p>Loading...</p>,
  ssr: false,
});
```

**Route-based Code Splitting:**
Next.js automatically splits code by routes, but you can optimize further:

```javascript
// app/admin/dashboard/page.js
export const dynamic = "force-dynamic"; // For dynamic content
export const revalidate = 60; // Revalidate every 60 seconds
```

### 5. API Route Optimization

**Streaming Responses:**

```javascript
// For large datasets
export async function GET(request) {
  const stream = new ReadableStream({
    async start(controller) {
      const cursor = Booking.find().cursor();

      for await (const doc of cursor) {
        controller.enqueue(JSON.stringify(doc) + "\n");
      }

      controller.close();
    },
  });

  return new Response(stream);
}
```

**Parallel Queries:**

```javascript
// Instead of sequential:
const user = await User.findById(id);
const bookings = await Booking.find({ user: id });
const garage = await Garage.findById(user.garageId);

// Use parallel:
const [user, bookings, garage] = await Promise.all([
  User.findById(id),
  Booking.find({ user: id }),
  Garage.findById(user.garageId),
]);
```

### 6. Connection Pooling

**MongoDB Connection Pool:**

```javascript
// lib/db/connect.js
const options = {
  maxPoolSize: 10, // Maximum connections
  minPoolSize: 2, // Minimum connections
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
};

await mongoose.connect(process.env.MONGODB_URI, options);
```

### 7. Compression

**Enable Gzip/Brotli:**

```javascript
// next.config.js
module.exports = {
  compress: true, // Enable gzip compression
};
```

### 8. Static Generation (ISR)

**For semi-static pages:**

```javascript
// app/garages/page.js
export const revalidate = 3600; // Revalidate every hour

export default async function GaragesPage() {
  const garages = await Garage.find().limit(20);
  return <GarageList garages={garages} />;
}
```

---

## 📊 Performance Monitoring

### 1. Add Performance Logging

```javascript
// lib/utils/performance.js
export function measurePerformance(name, fn) {
  return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    const duration = performance.now() - start;

    logInfo(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` });

    return result;
  };
}
```

### 2. Database Query Monitoring

```javascript
// Enable MongoDB slow query logging
mongoose.set("debug", (collectionName, method, query, doc) => {
  const start = Date.now();
  // Log slow queries (>100ms)
  if (Date.now() - start > 100) {
    logWarn("Slow Query", {
      collection: collectionName,
      method,
      duration: `${Date.now() - start}ms`,
    });
  }
});
```

---

## 🎯 Priority Recommendations

1. **Immediate** (Do Now):

   - ✅ Database indexes (Already done)
   - ✅ Pagination (Already done for admin)
   - Add pagination to all list endpoints

2. **Short Term** (Next Sprint):

   - Redis caching for frequently accessed data
   - Image optimization with Cloudinary
   - Lean queries for read-heavy operations

3. **Long Term** (Before Scale):
   - CDN for static assets
   - Database read replicas
   - Load balancing
   - Monitoring tools (New Relic, DataDog)

---

## 📈 Expected Performance Gains

- **Redis Caching**: 50-80% reduction in database queries
- **Lean Queries**: 20-30% faster query execution
- **Image Optimization**: 60-70% reduction in image size
- **Code Splitting**: 30-40% faster initial page load
- **Compression**: 70-80% reduction in response size
