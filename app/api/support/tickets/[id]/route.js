import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import SupportTicket from "@/lib/db/models/SupportTicket";
import Conversation from "@/lib/db/models/Conversation";
import Notification from "@/lib/db/models/Notification";
import { verifyToken } from "@/lib/utils/auth";
import { pusherServer } from "@/lib/pusher";

/**
 * GET /api/support/tickets/[id]
 * Get single ticket details
 */
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

    const ticket = await SupportTicket.findById(id)
      .populate("user", "name email avatar phone")
      .populate("assignedAgent", "name avatar email")
      .populate({
        path: "conversation",
        populate: {
          path: "participants",
          select: "name avatar",
        },
      });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    // Check access permission
    if (
      decoded.role !== "admin" &&
      ticket.user._id.toString() !== decoded.userId
    ) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/support/tickets/[id]
 * Update ticket status, assign agent, add notes
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
    const { status, assignedAgent, internalNote, priority } =
      await request.json();

    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    // Only admins can update tickets (except user can close their own)
    if (decoded.role !== "admin") {
      if (
        ticket.user.toString() !== decoded.userId ||
        (status && status !== "closed")
      ) {
        return NextResponse.json(
          { success: false, message: "Access denied" },
          { status: 403 }
        );
      }
    }

    // Update fields
    if (status) {
      ticket.status = status;
      if (status === "resolved") {
        ticket.resolvedAt = new Date();
      } else if (status === "closed") {
        ticket.closedAt = new Date();
      }
    }

    if (assignedAgent && decoded.role === "admin") {
      ticket.assignedAgent = assignedAgent;

      // Notify newly assigned agent
      await Notification.create({
        recipient: assignedAgent,
        type: "system_alert",
        title: "🎫 Support Ticket Assigned to You",
        message: `${ticket.subject}`,
        link: `/admin/support/tickets/${ticket._id}`,
      });
    }

    if (priority && decoded.role === "admin") {
      ticket.priority = priority;
    }

    if (internalNote && decoded.role === "admin") {
      ticket.internalNotes.push({
        agent: decoded.userId,
        note: internalNote,
        createdAt: new Date(),
      });
    }

    await ticket.save();

    // Broadcast update to relevant users
    try {
      await pusherServer.trigger(`ticket-${ticket._id}`, "ticket-updated", {
        ticketId: ticket._id,
        status: ticket.status,
        updatedAt: new Date(),
      });

      // Notify ticket owner if status changed
      if (status && ticket.user.toString() !== decoded.userId) {
        await pusherServer.trigger(`user-${ticket.user}`, "ticket-update", {
          ticketId: ticket._id,
          status: ticket.status,
        });
      }
    } catch (pusherError) {
      console.error("Pusher broadcast error:", pusherError);
    }

    const updatedTicket = await SupportTicket.findById(ticket._id)
      .populate("user", "name email avatar")
      .populate("assignedAgent", "name avatar");

    return NextResponse.json({
      success: true,
      message: "Ticket updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/support/tickets/[id]
 * Delete ticket (admin only)
 */
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const ticket = await SupportTicket.findByIdAndDelete(id);

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Delete ticket error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
