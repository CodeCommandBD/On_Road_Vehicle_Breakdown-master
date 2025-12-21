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
 * GET /api/admin/counts
 * Get counts for sidebar badges (admin only)
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

    // Get new inquiries count (status = new)
    const newInquiriesCount = await ContactInquiry.countDocuments({
      status: "new",
    });

    // Get pending support tickets count
    let pendingSupportCount = 0;
    try {
      const Support = (await import("@/lib/db/models/Support")).default;
      pendingSupportCount = await Support.countDocuments({
        status: "pending",
      });
    } catch (supportError) {
      console.log("Support model not found, skipping support count");
    }

    // Messages count - assuming you have a Message model
    // If not, we'll skip this for now
    let unreadMessagesCount = 0;
    try {
      const Message = (await import("@/lib/db/models/Message")).default;
      unreadMessagesCount = await Message.countDocuments({
        isRead: false,
        recipientRole: "admin",
      });
    } catch (messageError) {
      // Message model might not exist yet
      console.log("Message model not found, skipping messages count");
    }

    return NextResponse.json({
      success: true,
      counts: {
        inquiries: newInquiriesCount,
        support: pendingSupportCount,
        messages: unreadMessagesCount,
      },
    });
  } catch (error) {
    console.error("Admin Counts Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
