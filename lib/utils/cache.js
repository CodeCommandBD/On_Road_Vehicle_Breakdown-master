/**
 * Redis Caching Utility (Upstash REST API)
 * Provides caching layer to reduce database load for high-traffic scenarios
 * Uses Upstash REST API for serverless/edge compatibility
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Make a request to Upstash REST API
 */
async function upstashRequest(command) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.warn("⚠️ Upstash credentials not configured, caching disabled");
    return null;
  }

  try {
    const response = await fetch(`${UPSTASH_URL}/${command.join("/")}`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Upstash error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Upstash request error:", error);
    return null;
  }
}

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached data or null
 */
export async function getCached(key) {
  try {
    const data = await upstashRequest(["GET", key]);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Cache GET error:", error);
    return null;
  }
}

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {any} value - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 */
export async function setCached(key, value, ttl = 300) {
  try {
    await upstashRequest(["SETEX", key, ttl.toString(), JSON.stringify(value)]);
  } catch (error) {
    console.error("Cache SET error:", error);
  }
}

/**
 * Delete cached data
 * @param {string} key - Cache key
 */
export async function deleteCached(key) {
  try {
    await upstashRequest(["DEL", key]);
  } catch (error) {
    console.error("Cache DELETE error:", error);
  }
}

/**
 * Delete all keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., "garages:*")
 */
export async function invalidatePattern(pattern) {
  try {
    // Note: KEYS command is not recommended in production for large datasets
    // Consider using SCAN for production use
    const keys = await upstashRequest(["KEYS", pattern]);
    if (keys && keys.length > 0) {
      await upstashRequest(["DEL", ...keys]);
    }
  } catch (error) {
    console.error("Cache INVALIDATE error:", error);
  }
}

export default {
  getCached,
  setCached,
  deleteCached,
  invalidatePattern,
};
