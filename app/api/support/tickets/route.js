import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import SupportTicket from "@/lib/db/models/SupportTicket";
import Conversation from "@/lib/db/models/Conversation";
import User from "@/lib/db/models/User";
import Notification from "@/lib/db/models/Notification";
import { verifyToken } from "@/lib/utils/auth";
import { pusherServer } from "@/lib/pusher";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
export async function POST(request) {
  // Rate limiting: 5 tickets per hour
  const rateLimitResult = rateLimitMiddleware(request, 5, 60 * 60 * 1000);
  if (rateLimitResult) return rateLimitResult;

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

    const { subject, message, priority, category } = await request.json();

    // Validation
    if (!subject || !message) {
      return NextResponse.json(
        { success: false, message: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Create support ticket
    const ticket = await SupportTicket.create({
      user: decoded.userId,
      subject,
      message,
      priority: priority || "normal",
      category: category || "general",
      status: "open",
    });

    // Find available support agents (admins)
    const agents = await User.find({
      role: "admin",
      onlineStatus: { $in: ["online", "away"] },
    })
      .sort({ "availability.lastUpdated": -1 })
      .limit(5);

    // Auto-assign to first available agent
    if (agents.length > 0) {
      ticket.assignedAgent = agents[0]._id;
      ticket.status = "in-progress";
      await ticket.save();

      // Create notification for assigned agent
      await Notification.create({
        recipient: agents[0]._id,
        type: "system_alert",
        title: `🎫 New Support Ticket Assigned`,
        message: `Priority: ${priority || "normal"} - ${subject}`,
        link: `/admin/support/tickets/${ticket._id}`,
        metadata: {
          ticketId: ticket._id,
          priority: ticket.priority,
        },
      });
    }

    // Broadcast to all online support agents
    try {
      await pusherServer.trigger("support-agents", "new-ticket", {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        subject,
        priority: ticket.priority,
        category: ticket.category,
        userId: decoded.userId,
        createdAt: ticket.createdAt,
      });
    } catch (pusherError) {
      console.error("Pusher broadcast error:", pusherError);
    }

    // Populate user info
    const populatedTicket = await SupportTicket.findById(ticket._id).populate(
      "user",
      "name email avatar"
    );

    return NextResponse.json({
      success: true,
      message: "Support ticket created successfully",
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/support/tickets
 * Get support tickets (filtered by role)
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
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    let query = {};

    // Role-based filtering
    if (decoded.role === "admin") {
      // Admins see all tickets or assigned to them
      if (searchParams.get("assigned") === "me") {
        query.assignedAgent = decoded.userId;
      }
    } else {
      // Users see only their own tickets
      query.user = decoded.userId;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Priority filter
    if (priority) {
      query.priority = priority;
    }

    const tickets = await SupportTicket.find(query)
      .populate("user", "name email avatar")
      .populate("assignedAgent", "name avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      tickets,
      count: tickets.length,
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
