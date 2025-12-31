import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { verifyToken } from "@/lib/utils/auth";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";

/**
 * POST /api/messages/typing
 * Broadcast typing indicator to conversation participants
 */
export async function POST(request) {
  // Rate limiting: 60 requests per minute (typing is frequent)
  const rateLimitResult = rateLimitMiddleware(request, 60, 60 * 1000);
  if (rateLimitResult) return rateLimitResult;

  try {
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { conversationId, isTyping } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: "Conversation ID required" },
        { status: 400 }
      );
    }

    // Broadcast typing status to conversation channel
    await pusherServer.trigger(`conversation-${conversationId}`, "typing", {
      userId: decoded.userId,
      isTyping: !!isTyping,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Typing status broadcast",
    });
  } catch (error) {
    console.error("Typing indicator error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
