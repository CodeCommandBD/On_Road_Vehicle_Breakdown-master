import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Message from "@/lib/db/models/Message";
import Conversation from "@/lib/db/models/Conversation";
import { verifyToken } from "@/lib/utils/auth";

// GET: Fetch all messages for a specific conversation
export async function GET(request, { params }) {
  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if user is a participant in this conversation
    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.participants.includes(decoded.userId)) {
      return NextResponse.json(
        { success: false, message: "Conversation not found or access denied" },
        { status: 403 }
      );
    }

    const messages = await Message.find({ conversation: id }).sort({
      createdAt: 1,
    });

    // Mark messages as read (optional but recommended)
    await Message.updateMany(
      { conversation: id, sender: { $ne: decoded.userId }, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Message details GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
