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
 * GET /api/admin/inquiries
 * Fetch all inquiries (admin only)
 */
export async function GET(request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    await connectDB();
    const inquiries = await ContactInquiry.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      inquiries,
    });
  } catch (error) {
    console.error("Admin Inquiries GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/inquiries
 * Update inquiry status (admin only)
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
    const { inquiryId, status, notes } = await request.json();

    if (!inquiryId) {
      return NextResponse.json(
        { success: false, message: "Inquiry ID required" },
        { status: 400 }
      );
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const inquiry = await ContactInquiry.findByIdAndUpdate(
      inquiryId,
      updateData,
      { new: true }
    );

    if (!inquiry) {
      return NextResponse.json(
        { success: false, message: "Inquiry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Inquiry updated successfully",
      inquiry,
    });
  } catch (error) {
    console.error("Admin Inquiries PATCH Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
