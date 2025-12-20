import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import User from "@/lib/db/models/User";
import connectDB from "@/lib/db/connect";

export async function POST(req) {
  try {
    await connectDB();
    const headersList = await headers();
    const token = headersList.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, documentUrl, startDate, endDate, status, customTerms } =
      body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update contract details
    user.contract = {
      documentUrl,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status || "pending",
      customTerms,
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Contract updated successfully",
      contract: user.contract,
    });
  } catch (error) {
    console.error("Contract update error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
