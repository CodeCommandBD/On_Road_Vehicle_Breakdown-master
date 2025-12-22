import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import TeamInvitation from "@/lib/db/models/TeamInvitation";
import TeamMember from "@/lib/db/models/TeamMember";
import { verifyToken } from "@/lib/utils/auth";
import { hasPermission, PERMISSIONS } from "@/lib/utils/permissions";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if user is a member of the organization
    const membership = await TeamMember.findOne({
      organization: id,
      user: user.userId,
      isActive: true,
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Check for permission to view members/invitations
    if (!hasPermission(membership.role, PERMISSIONS.MEMBERS_VIEW)) {
      return NextResponse.json(
        { success: false, message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Fetch pending invitations
    const invitations = await TeamInvitation.find({
      organization: id,
      status: "pending",
      expiresAt: { $gt: new Date() },
    })
      .populate("invitedBy", "name")
      .sort({ createdAt: -1 });

    const formattedInvitations = invitations.map((inv) => ({
      id: inv._id,
      email: inv.email,
      role: inv.role,
      invitedBy: inv.invitedBy?.name,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedInvitations,
    });
  } catch (error) {
    console.error("List Invitations Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Server Error",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// PATCH: Resend invitation
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { invitationId } = await req.json();

    if (!invitationId) {
      return NextResponse.json(
        { success: false, message: "Invitation ID is required" },
        { status: 400 }
      );
    }

    // Check permission
    const membership = await TeamMember.findOne({
      organization: id,
      user: user.userId,
      isActive: true,
    });

    if (
      !membership ||
      !hasPermission(membership.role, PERMISSIONS.MEMBERS_INVITE)
    ) {
      return NextResponse.json(
        { success: false, message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const Organization = (await import("@/lib/db/models/Organization")).default;
    const { sendInvitationEmail } = await import("@/lib/utils/email");

    const invitation = await TeamInvitation.findOne({
      _id: invitationId,
      organization: id,
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, message: "Invitation not found" },
        { status: 404 }
      );
    }

    // Reset expiry
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invitation.save();

    const organization = await Organization.findById(id).select("name");

    // Send invitation email
    await sendInvitationEmail(
      invitation.email,
      invitation.token,
      organization?.name || "On-Road Vehicle Breakdown"
    );

    return NextResponse.json({
      success: true,
      message: "Invitation resent successfully",
    });
  } catch (error) {
    console.error("Resend Invitation Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server Error" },
      { status: 500 }
    );
  }
}
