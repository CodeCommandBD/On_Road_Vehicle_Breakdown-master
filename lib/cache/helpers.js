import redis from "./redis";

/**
 * Get data from cache or fetch from source and cache it
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if cache miss
 * @param {number} ttl - Time to live in seconds (default 300s = 5m)
 * @returns {Promise<any>} - Data
 */
// In-memory fallback
const memoryCache = new Map();

/**
 * Get data from cache or fetch from source and cache it
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if cache miss
 * @param {number} ttl - Time to live in seconds (default 300s = 5m)
 * @returns {Promise<any>} - Data
 */
export async function getOrSet(key, fetchFn, ttl = 300) {
  // If Redis is not available, use in-memory cache
  if (!redis) {
    const cached = memoryCache.get(key);
    const now = Date.now();

    if (cached && cached.expiry > now) {
      // console.log(`Memory Cache HIT: ${key}`);
      return cached.data;
    }

    // console.log(`Memory Cache MISS: ${key}`);
    const data = await fetchFn();

    if (data) {
      memoryCache.set(key, {
        data,
        expiry: now + ttl * 1000,
      });

      // Cleanup old keys occasionally (simple implementation)
      if (memoryCache.size > 100) {
        const firstKey = memoryCache.keys().next().value;
        memoryCache.delete(firstKey);
      }
    }

    return data;
  }

  try {
    // Try to get from Redis cache
    const cachedData = await redis.get(key);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const data = await fetchFn();

    // Store in Redis cache
    if (data) {
      await redis.setex(key, ttl, JSON.stringify(data));
    }

    return data;
  } catch (error) {
    console.error(`Cache Error for key ${key}:`, error);
    // Fallback to fetch without caching on error
    return fetchFn();
  }
}

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Key pattern (e.g. "services:*")
 */
export async function invalidate(pattern) {
  // Clear memory cache matching pattern
  const regex = new RegExp(pattern.replace("*", ".*"));
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }

  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`Invalidated ${keys.length} keys for pattern: ${pattern}`);
    }
  } catch (error) {
    console.error(`Invalidate Error for pattern ${pattern}:`, error);
  }
}

/**
 * Invalidate specific keys
 * @param {string[]} keys - Array of keys to delete
 */
export async function invalidateMultiple(keys) {
  // Clear memory cache for specific keys
  keys.forEach((key) => memoryCache.delete(key));

  if (!redis || !keys.length) return;

  try {
    await redis.del(keys);
  } catch (error) {
    console.error("Invalidate Multiple Error:", error);
  }
}
