import { Redis } from "@upstash/redis";

let redis;

try {
  // Check if Upstash credentials are available (production)
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log("✅ Upstash Redis initialized (production)");
  }
  // Fallback to local Redis (development)
  else if (process.env.REDIS_URL) {
    // For local development, use ioredis
    const IORedis = require("ioredis").default;
    redis = new IORedis(process.env.REDIS_URL, {
      retryStrategy(times) {
        if (times > 3) {
          console.warn("Retrying Redis connection...");
          return null;
        }
        return Math.min(times * 50, 2000);
      },
      maxRetriesPerRequest: 3,
    });

    redis.on("error", (error) => {
      console.warn("Redis connection error:", error.message);
    });

    redis.on("connect", () => {
      console.log("✅ Local Redis connected (development)");
    });
  } else {
    console.warn("⚠️ No Redis configuration found");
  }
} catch (error) {
  console.error("Failed to initialize Redis client:", error);
}

export default redis;
