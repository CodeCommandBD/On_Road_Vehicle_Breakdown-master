# Redis Setup Guide

## Installation

### Option 1: Local Development (Windows)

```bash
# Using Chocolatey
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
```

### Option 2: Docker (Recommended for Development)

```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### Option 3: Cloud Redis (Production)

- **Upstash**: https://upstash.com/ (Free tier available, serverless)
- **Redis Cloud**: https://redis.com/try-free/
- **AWS ElastiCache**: For AWS deployments

## Environment Variables

Add to your `.env.local`:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# For Upstash or cloud Redis:
# REDIS_URL=rediss://default:your-password@your-redis-url.upstash.io:6379
```

## NPM Package Installation

```bash
npm install redis
```

## Testing Redis Connection

Run this in your terminal after starting Redis:

```bash
# Test if Redis is running
redis-cli ping
# Should return: PONG
```

## Usage in Your Application

The Redis caching utility (`lib/utils/cache.js`) will automatically:

- Connect to Redis on first use
- Gracefully degrade to direct DB queries if Redis is unavailable
- Log connection status to console

## Cache Invalidation

When you update garage or service data, you should invalidate the cache:

```javascript
import { invalidatePattern } from "@/lib/utils/cache";

// After updating a garage
await invalidatePattern("garages:*");

// After updating services
await invalidatePattern("services:*");
```

## Monitoring

Check cache hit/miss rates in API responses:

- `X-Cache: HIT` = Data served from Redis
- `X-Cache: MISS` = Data fetched from MongoDB and cached

## Production Recommendations

1. **Use Redis Cloud or Upstash** for managed Redis
2. **Set appropriate TTL** (Time To Live) based on data update frequency
3. **Monitor memory usage** - Redis stores data in RAM
4. **Enable persistence** for critical cached data
5. **Use Redis Cluster** for very high traffic (1M+ users)
