import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import TeamInvitation from "@/lib/db/models/TeamInvitation";
import TeamMember from "@/lib/db/models/TeamMember";
import User from "@/lib/db/models/User";
import Organization from "@/lib/db/models/Organization";
import { verifyToken } from "@/lib/utils/auth";
import { logActivity } from "@/lib/utils/activity";

export async function POST(req) {
  try {
    await connectDB();
    const { token: inviteToken } = await req.json();

    if (!inviteToken) {
      return NextResponse.json(
        { success: false, message: "Token is required" },
        { status: 400 }
      );
    }

    // specific check for current user to bind the invite
    const userToken = req.cookies.get("token")?.value;
    const user = await verifyToken(userToken);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please login to accept the invitation" },
        { status: 401 }
      );
    }

    // Find invitation
    const invitation = await TeamInvitation.findOne({
      token: inviteToken,
      status: "pending",
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    if (!invitation.isValid()) {
      invitation.status = "expired";
      await invitation.save();
      return NextResponse.json(
        { success: false, message: "Invitation has expired" },
        { status: 400 }
      );
    }

    // detailed check: matching email
    // If the logged-in user's email doesn't match the invite email, we might block or warn.
    // For now, assuming strict email matching is better for security.
    const currentUser = await User.findById(user.userId);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (currentUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          message: "This invitation was sent to a different email address.",
        },
        { status: 403 }
      );
    }

    // Check if already a member
    const existingMember = await TeamMember.findOne({
      organization: invitation.organization,
      user: user.userId,
      isActive: true,
    });

    if (existingMember) {
      // Already member, just mark invite as accepted
      invitation.status = "accepted";
      invitation.acceptedAt = new Date();
      invitation.acceptedBy = user.userId;
      await invitation.save();

      return NextResponse.json({
        success: true,
        message: "You are already a member of this organization",
      });
    }

    // Create membership
    await TeamMember.create({
      organization: invitation.organization,
      user: user.userId,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
    });

    // Update invitation status
    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = user.userId;
    await invitation.save();

    // Update org member count
    await Organization.findByIdAndUpdate(invitation.organization, {
      $inc: { memberCount: 1 },
    });

    // Log activity
    await logActivity({
      organizationId: invitation.organization,
      userId: user.userId,
      action: "member_joined",
      metadata: { role: invitation.role, invitationId: invitation._id },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Invitation accepted! You have joined the team.",
    });
  } catch (error) {
    console.error("Accept Invite Error:", error);
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
