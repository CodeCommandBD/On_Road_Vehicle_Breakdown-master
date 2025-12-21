import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Organization from "@/lib/db/models/Organization";
import TeamMember from "@/lib/db/models/TeamMember";
import TeamInvitation from "@/lib/db/models/TeamInvitation";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";
import { logActivity } from "@/lib/utils/activity";
import {
  hasPermission,
  canManageRole,
  PERMISSIONS,
} from "@/lib/utils/permissions";

// GET: List organization members
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

    const { id } = params;

    // Check membership
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

    // Get all members
    const members = await TeamMember.find({
      organization: id,
      isActive: true,
    })
      .populate("user", "name email createdAt")
      .populate("invitedBy", "name")
      .sort({ role: 1, joinedAt: 1 });

    const formattedMembers = members.map((member) => ({
      id: member._id,
      userId: member.user._id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
      joinedAt: member.joinedAt,
      lastActiveAt: member.lastActiveAt,
      invitedBy: member.invitedBy?.name,
      canManage: canManageRole(membership.role, member.role),
    }));

    return NextResponse.json({
      success: true,
      data: formattedMembers,
    });
  } catch (error) {
    console.error("List Members Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

// POST: Invite member
export async function POST(req, { params }) {
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

    const { id } = params;
    const { email, role = "member", customMessage } = await req.json();

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email address" },
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

    // Check if user already exists as member
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const existingMember = await TeamMember.findOne({
        organization: id,
        user: existingUser._id,
      });

      if (existingMember && existingMember.isActive) {
        return NextResponse.json(
          { success: false, message: "User is already a member" },
          { status: 400 }
        );
      }
    }

    // Check for pending invitation
    const pendingInvitation = await TeamInvitation.findOne({
      organization: id,
      email: email.toLowerCase(),
      status: "pending",
    });

    if (pendingInvitation && pendingInvitation.isValid()) {
      return NextResponse.json(
        { success: false, message: "Invitation already sent to this email" },
        { status: 400 }
      );
    }

    // Create invitation
    const invitation = await TeamInvitation.create({
      organization: id,
      email: email.toLowerCase(),
      role,
      invitedBy: user.userId,
      metadata: { customMessage },
    });

    // Log activity
    await logActivity({
      organizationId: id,
      userId: user.userId,
      action: "member_invited",
      targetEmail: email,
      metadata: { role, invitationId: invitation._id },
      req,
    });

    // TODO: Send invitation email
    // await sendInvitationEmail(email, invitation.token, organization.name);

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      data: {
        invitationId: invitation._id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Invite Member Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove member
export async function DELETE(req, { params }) {
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

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const memberUserId = searchParams.get("userId");

    if (!memberUserId) {
      return NextResponse.json(
        { success: false, message: "Member user ID is required" },
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
      !hasPermission(membership.role, PERMISSIONS.MEMBERS_REMOVE)
    ) {
      return NextResponse.json(
        { success: false, message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get target member
    const targetMember = await TeamMember.findOne({
      organization: id,
      user: memberUserId,
      isActive: true,
    });

    if (!targetMember) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }

    // Can't remove yourself
    if (memberUserId === user.userId) {
      return NextResponse.json(
        { success: false, message: "Cannot remove yourself" },
        { status: 400 }
      );
    }

    // Check if can manage target role
    if (!canManageRole(membership.role, targetMember.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot remove member with equal or higher role",
        },
        { status: 403 }
      );
    }

    // Remove member (soft delete)
    targetMember.isActive = false;
    await targetMember.save();

    // Update member count
    await Organization.findByIdAndUpdate(id, {
      $inc: { memberCount: -1 },
    });

    // Log activity
    await logActivity({
      organizationId: id,
      userId: user.userId,
      action: "member_removed",
      targetUser: memberUserId,
      metadata: { role: targetMember.role },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove Member Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
