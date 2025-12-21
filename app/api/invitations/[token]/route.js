import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import TeamInvitation from "@/lib/db/models/TeamInvitation";
import TeamMember from "@/lib/db/models/TeamMember";
import Organization from "@/lib/db/models/Organization";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";
import { logActivity } from "@/lib/utils/activity";

// GET: View invitation details (public with token)
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { token } = params;

    const invitation = await TeamInvitation.findOne({ token })
      .populate("organization", "name slug")
      .populate("invitedBy", "name");

    if (!invitation) {
      return NextResponse.json(
        { success: false, message: "Invitation not found" },
        { status: 404 }
      );
    }

    if (!invitation.isValid()) {
      return NextResponse.json(
        { success: false, message: "Invitation has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        organizationName: invitation.organization.name,
        role: invitation.role,
        invitedBy: invitation.invitedBy.name,
        expiresAt: invitation.expiresAt,
        customMessage: invitation.metadata?.customMessage,
      },
    });
  } catch (error) {
    console.error("Get Invitation Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

// POST: Accept invitation
export async function POST(req, { params }) {
  try {
    await connectDB();
    const authToken = req.cookies.get("token")?.value;
    const user = await verifyToken(authToken);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please login to accept invitation" },
        { status: 401 }
      );
    }

    const { token } = params;

    const invitation = await TeamInvitation.findOne({ token }).populate(
      "organization"
    );

    if (!invitation) {
      return NextResponse.json(
        { success: false, message: "Invitation not found" },
        { status: 404 }
      );
    }

    if (!invitation.isValid()) {
      return NextResponse.json(
        { success: false, message: "Invitation has expired or is invalid" },
        { status: 410 }
      );
    }

    // Check if email matches
    const userDoc = await User.findById(user.userId);
    if (userDoc.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          message: "This invitation was sent to a different email address",
        },
        { status: 403 }
      );
    }

    // Check if already a member
    const existingMember = await TeamMember.findOne({
      organization: invitation.organization._id,
      user: user.userId,
    });

    if (existingMember && existingMember.isActive) {
      return NextResponse.json(
        { success: false, message: "You are already a member" },
        { status: 400 }
      );
    }

    // Create or reactivate team member
    if (existingMember) {
      existingMember.isActive = true;
      existingMember.role = invitation.role;
      existingMember.joinedAt = new Date();
      await existingMember.save();
    } else {
      await TeamMember.create({
        organization: invitation.organization._id,
        user: user.userId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        joinedAt: new Date(),
      });
    }

    // Update invitation status
    await invitation.accept(user.userId);

    // Update member count
    await Organization.findByIdAndUpdate(invitation.organization._id, {
      $inc: { memberCount: 1 },
    });

    // Log activity
    await logActivity({
      organizationId: invitation.organization._id,
      userId: user.userId,
      action: "invitation_accepted",
      metadata: { role: invitation.role },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
      data: {
        organizationId: invitation.organization._id,
        organizationSlug: invitation.organization.slug,
      },
    });
  } catch (error) {
    console.error("Accept Invitation Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
