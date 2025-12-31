import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/auth";
import connectDB from "@/lib/db/connect";
import Invoice from "@/lib/db/models/Invoice";

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const invoices = await Invoice.find({ userId: decoded.userId }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      invoices,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
