import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Message from "@/lib/db/models/Message";
import Conversation from "@/lib/db/models/Conversation";
import { verifyToken } from "@/lib/utils/auth";

/**
 * GET /api/messages/search
 * Search messages in conversations
 */
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const conversationId = searchParams.get("conversationId");

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Search query is required" },
        { status: 400 }
      );
    }

    // Build search filter
    const filter = {
      text: { $regex: query, $options: "i" }, // Case-insensitive search
    };

    // If conversationId provided, search only in that conversation
    if (conversationId) {
      filter.conversation = conversationId;
    } else {
      // Search in all user's conversations
      const userConversations = await Conversation.find({
        participants: decoded.userId,
      }).select("_id");

      filter.conversation = {
        $in: userConversations.map((c) => c._id),
      };
    }

    // Search messages
    const messages = await Message.find(filter)
      .populate("sender", "name avatar")
      .populate("conversation")
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      results: messages,
      count: messages.length,
      query,
    });
  } catch (error) {
    console.error("Message search error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
