import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Newsletter from "@/lib/models/Newsletter";

export async function GET(request) {
  try {
    await dbConnect();

    // Fetch all subscribers
    const subscribers = await Newsletter.find({}).sort({ subscribedAt: -1 });

    // Calculate stats
    const stats = {
      total: subscribers.length,
      active: subscribers.filter((s) => s.isActive).length,
      inactive: subscribers.filter((s) => !s.isActive).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        subscribers,
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch subscribers",
      },
      { status: 500 }
    );
  }
}
