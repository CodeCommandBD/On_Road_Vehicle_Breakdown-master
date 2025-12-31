const Redis = require("ioredis");

async function testConnection() {
  console.log("Testing connection to localhost:6379...");
  const redis = new Redis("redis://localhost:6379", {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Don't retry
  });

  try {
    const result = await redis.ping();
    console.log("Connection successful! PING response:", result);
    await redis.quit();
    process.exit(0);
  } catch (error) {
    console.error("Connection failed:", error.message);
    await redis.quit();
    process.exit(1);
  }
}

testConnection();
