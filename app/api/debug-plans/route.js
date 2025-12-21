import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();

    // Bypass Mongoose model to see raw data
    const plans = await mongoose.connection.db
      .collection("plans")
      .find({})
      .toArray();

    return NextResponse.json({
      success: true,
      count: plans.length,
      plans: plans, // Return everything
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
