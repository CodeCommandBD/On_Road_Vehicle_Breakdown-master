import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Message from "@/lib/db/models/Message";
import Conversation from "@/lib/db/models/Conversation";
import { verifyToken } from "@/lib/utils/auth";

/**
 * PATCH /api/messages/[id]/read
 * Mark message as read
 */
export async function PATCH(request, { params }) {
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

    // Find message
    const message = await Message.findById(id).populate("conversation");

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Message not found" },
        { status: 404 }
      );
    }

    // Only recipient can mark as read
    if (message.sender.toString() === decoded.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot mark own message as read",
        },
        { status: 400 }
      );
    }

    // Mark as read
    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    // Decrement unread count in conversation
    const conversation = await Conversation.findById(message.conversation);
    if (conversation) {
      const unreadKey = `unreadCount.${decoded.userId}`;
      const currentCount = conversation.unreadCount.get(decoded.userId) || 0;

      if (currentCount > 0) {
        conversation.unreadCount.set(decoded.userId, currentCount - 1);
        await conversation.save();
      }
    }

    // Broadcast read receipt via Pusher
    try {
      const { pusherServer } = await import("@/lib/pusher");

      await pusherServer.trigger(
        `conversation-${message.conversation}`,
        "message-read",
        {
          messageId: message._id,
          readBy: decoded.userId,
          readAt: message.readAt,
        }
      );

      console.log(`✅ Read receipt broadcast for message ${message._id}`);
    } catch (pusherError) {
      console.error("Pusher read receipt error:", pusherError);
    }

    return NextResponse.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
