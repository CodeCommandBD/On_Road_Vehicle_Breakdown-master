import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import ContactInquiry from "@/lib/db/models/ContactInquiry";
import { verifyToken } from "@/lib/utils/auth";

async function checkAdmin(request) {
  const token = request.cookies.get("token")?.value;
  const decoded = await verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

/**
 * PATCH /api/admin/inquiries/mark-viewed
 * Mark all new inquiries as viewed (admin only)
 */
export async function PATCH(request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    await connectDB();

    // Update all 'new' inquiries to 'contacted' status
    // This will reset the counter
    await ContactInquiry.updateMany({ status: "new" }, { status: "contacted" });

    return NextResponse.json({
      success: true,
      message: "Inquiries marked as viewed",
    });
  } catch (error) {
    console.error("Mark Inquiries Viewed Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
