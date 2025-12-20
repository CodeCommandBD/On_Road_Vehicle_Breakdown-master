import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Conversation from "@/lib/db/models/Conversation";
import Message from "@/lib/db/models/Message";
import User from "@/lib/db/models/User";
import Notification from "@/lib/db/models/Notification";
import { verifyToken } from "@/lib/utils/auth";

// GET: Fetch all conversations for the logged-in user
export async function GET(request) {
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

    const conversations = await Conversation.find({
      participants: decoded.userId,
    })
      .populate("participants", "name avatar role")
      .sort({ updatedAt: -1 });

    return NextResponse.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new conversation or send a message
export async function POST(request) {
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

    const { recipientId, text, bookingId } = await request.json();

    if (!recipientId || !text) {
      return NextResponse.json(
        { success: false, message: "Recipient and text are required" },
        { status: 400 }
      );
    }

    // Find existing conversation between these participants
    let conversation = await Conversation.findOne({
      participants: { $all: [decoded.userId, recipientId] },
      booking: bookingId || null,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [decoded.userId, recipientId],
        booking: bookingId || null,
      });
    }

    // Create the message
    const message = await Message.create({
      conversation: conversation._id,
      sender: decoded.userId,
      text,
    });

    // Update last message and increment unread count for recipient
    const unreadKey = `unreadCount.${recipientId}`;
    await Conversation.findByIdAndUpdate(conversation._id, {
      $set: {
        lastMessage: {
          text,
          sender: decoded.userId,
          createdAt: new Date(),
        },
      },
      $inc: { [unreadKey]: 1 },
    });

    // Create Notification for the recipient
    try {
      const sender = await User.findById(decoded.userId).select("name");
      const recipientUser = await User.findById(recipientId).select("role");

      if (recipientUser) {
        let dashboardLink = "/user/dashboard/messages";
        if (recipientUser.role === "admin") {
          dashboardLink = "/admin/messages";
        } else if (recipientUser.role === "garage") {
          dashboardLink = "/garage/dashboard/messages";
        }

        await Notification.create({
          recipient: recipientId,
          sender: decoded.userId,
          type: "message_new",
          title: `New message from ${sender?.name || "Someone"}`,
          message: text.length > 50 ? text.substring(0, 47) + "..." : text,
          link: `${dashboardLink}?chatId=${conversation._id}`,
          metadata: {
            conversationId: conversation._id,
            messageId: message._id,
          },
        });
      }
    } catch (notifyError) {
      console.error("Failed to create message notification:", notifyError);
      // Don't fail the message send if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Message sent",
      messageData: message,
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
