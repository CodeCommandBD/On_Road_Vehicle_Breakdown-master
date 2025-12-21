import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    const plansCollection = db.collection("plans");

    // 1. Force update Garage Plans
    // Using raw update to bypass any schema limitations
    const garageUpdate = await plansCollection.updateMany(
      { name: { $regex: /Garage/i } },
      { $set: { type: "garage" } }
    );

    // 2. Force update all others (Vehicle Owner plans)
    // Any plan that is NOT type: garage should be type: user
    const userUpdate = await plansCollection.updateMany(
      { type: { $ne: "garage" } },
      { $set: { type: "user" } }
    );

    // 3. Verify counts
    const garageCount = await plansCollection.countDocuments({
      type: "garage",
    });
    const userCount = await plansCollection.countDocuments({ type: "user" });

    return NextResponse.json({
      success: true,
      message: "Force migration complete",
      stats: {
        garageUpdated: garageUpdate.modifiedCount,
        userUpdated: userUpdate.modifiedCount,
        finalCounts: {
          garage: garageCount,
          user: userCount,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
