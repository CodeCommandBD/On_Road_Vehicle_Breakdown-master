import redis from "./redis";

/**
 * Get data from cache or fetch from source and cache it
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if cache miss
 * @param {number} ttl - Time to live in seconds (default 300s = 5m)
 * @returns {Promise<any>} - Data
 */
export async function getOrSet(key, fetchFn, ttl = 300) {
  if (!redis) {
    console.warn("Redis not initialized, fetching directly");
    return fetchFn();
  }

  try {
    // Try to get from cache
    const cachedData = await redis.get(key);

    if (cachedData) {
      // console.log(`Cache HIT: ${key}`);
      return JSON.parse(cachedData);
    }

    // console.log(`Cache MISS: ${key}`);
    const data = await fetchFn();

    // Store in cache
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
  if (!redis || !keys.length) return;

  try {
    await redis.del(keys);
  } catch (error) {
    console.error("Invalidate Multiple Error:", error);
  }
}
