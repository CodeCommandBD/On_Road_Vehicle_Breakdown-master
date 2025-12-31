import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/auth";
import connectDB from "@/lib/db/connect";
import Reward from "@/lib/db/models/Reward";

// GET: List all active rewards
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const query = { isActive: true };
    if (type) query.type = type;

    const rewards = await Reward.find(query).sort({ pointsCost: 1 });

    return NextResponse.json({
      success: true,
      rewards,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new reward (Admin only)
export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const data = await request.json();

    const reward = await Reward.create(data);

    return NextResponse.json({
      success: true,
      message: "Reward created successfully",
      reward,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
