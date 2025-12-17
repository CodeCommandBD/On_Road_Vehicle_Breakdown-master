import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/utils/auth";
import Payment from "@/lib/db/models/Payment";

export async function GET(request) {
  try {
    await connectDB();

    // Get authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user's payment history, sorted by most recent first
    const payments = await Payment.find({ userId: currentUser.userId })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to last 50 payments
      .select("-__v")
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        payments,
        total: payments.length,
      },
    });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
