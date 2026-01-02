import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/utils/auth";

// Force dynamic to ensure it runs on every request
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await connectDB();

    // 1. Security Check: Admin Only
    const currentUser = await getCurrentUser(request);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admins only" },
        { status: 403 }
      );
    }

    // 2. Check and Drop Collection
    const collections = await mongoose.connection.db
      .listCollections({ name: "plans" })
      .toArray();

    if (collections.length > 0) {
      await mongoose.connection.db.dropCollection("plans");
      return NextResponse.json({
        success: true,
        message:
          "✅ Successfully dropped 'plans' collection from the database.",
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "ℹ️ 'plans' collection does not exist (already clean).",
      });
    }
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { success: false, message: "Cleanup failed", error: error.message },
      { status: 500 }
    );
  }
}
