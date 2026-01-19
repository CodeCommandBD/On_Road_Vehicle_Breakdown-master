import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// Only enforce in runtime (not during build)
if (
  !MONGODB_URI &&
  process.env.NODE_ENV !== "production" &&
  typeof window === "undefined"
) {
  console.warn(
    "⚠️ MONGODB_URI environment variable is not set. " +
      "Database operations will fail. Please set it in your .env.local file.",
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  // Safety check for MONGODB_URI
  if (!MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI not set, skipping database connection");
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 100, // Optimized for high traffic
      minPoolSize: 10,
      connectTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB connected successfully");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("❌ MongoDB connection error:", e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
