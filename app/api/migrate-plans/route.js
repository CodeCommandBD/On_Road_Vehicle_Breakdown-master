import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Plan from "@/lib/db/models/Plan";

export async function GET() {
  try {
    await connectDB();

    // Update all plans that don't have a 'type' field
    const result = await Plan.updateMany(
      { type: { $exists: false } },
      { $set: { type: "user" } }
    );

    return NextResponse.json({
      success: true,
      message: `Migrated ${result.matchedCount} legacy plans to 'user' type.`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
