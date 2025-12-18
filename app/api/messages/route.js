import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Conversation from "@/lib/db/models/Conversation";
import Message from "@/lib/db/models/Message";
import User from "@/lib/db/models/User";
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

    // Update last message in conversation
    conversation.lastMessage = {
      text,
      sender: decoded.userId,
      createdAt: new Date(),
    };
    await conversation.save();

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
