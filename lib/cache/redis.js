import Redis from "ioredis";

const getRedisUrl = () => {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    return process.env.UPSTASH_REDIS_REST_URL;
  }
  return process.env.REDIS_URL || "redis://localhost:6379";
};

let redis;

try {
  redis = new Redis(getRedisUrl(), {
    retryStrategy(times) {
      if (times > 3) {
        console.warn("Retrying Redis connection...");
        return null; // Stop retrying after 3 attempts
      }
      return Math.min(times * 50, 2000);
    },
    maxRetriesPerRequest: 3,
  });

  redis.on("error", (error) => {
    console.warn("Redis connection error:", error);
  });

  redis.on("connect", () => {
    console.log("Redis connected successfully");
  });
} catch (error) {
  console.error("Failed to initialize Redis client:", error);
}

export default redis;
