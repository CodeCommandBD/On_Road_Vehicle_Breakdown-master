import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Organization from "@/lib/db/models/Organization";
import TeamMember from "@/lib/db/models/TeamMember";
import { verifyToken } from "@/lib/utils/auth";
import { logActivity } from "@/lib/utils/activity";
import { hasPermission, PERMISSIONS } from "@/lib/utils/permissions";

// GET: Get organization details
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

    // Check if user is a member
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

    // Get organization with owner details
    const organization = await Organization.findById(id).populate(
      "owner",
      "name email"
    );

    if (!organization) {
      return NextResponse.json(
        { success: false, message: "Organization not found" },
        { status: 404 }
      );
    }

    // Get members count
    const memberCount = await TeamMember.countDocuments({
      organization: id,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        owner: organization.owner,
        settings: organization.settings,
        memberCount,
        userRole: membership.role,
        createdAt: organization.createdAt,
      },
    });
  } catch (error) {
    console.error("Get Organization Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

// PATCH: Update organization
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

    // Check permission
    const membership = await TeamMember.findOne({
      organization: id,
      user: user.userId,
      isActive: true,
    });

    if (!membership || !hasPermission(membership.role, PERMISSIONS.ORG_WRITE)) {
      return NextResponse.json(
        { success: false, message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const updates = await req.json();
    const { name, settings, billingInfo } = updates;

    const organization = await Organization.findById(id);
    if (!organization) {
      return NextResponse.json(
        { success: false, message: "Organization not found" },
        { status: 404 }
      );
    }

    // Track changes
    const changes = { before: {}, after: {} };

    if (name) {
      changes.before.name = organization.name;
      organization.name = name;
      changes.after.name = name;
    }

    if (settings) {
      changes.before.settings = JSON.parse(
        JSON.stringify(organization.settings || {})
      );

      // Deep merge for settings
      if (!organization.settings) organization.settings = {};

      if (settings.webhookUrl !== undefined)
        organization.settings.webhookUrl = settings.webhookUrl;
      if (settings.webhookSecret !== undefined)
        organization.settings.webhookSecret = settings.webhookSecret;
      if (settings.webhookEvents !== undefined)
        organization.settings.webhookEvents = settings.webhookEvents;
      if (settings.webhookActive !== undefined)
        organization.settings.webhookActive = settings.webhookActive;

      if (settings.branding) {
        if (!organization.settings.branding)
          organization.settings.branding = {};
        if (settings.branding.logo !== undefined)
          organization.settings.branding.logo = settings.branding.logo;
        if (settings.branding.primaryColor !== undefined)
          organization.settings.branding.primaryColor =
            settings.branding.primaryColor;
        if (settings.branding.secondaryColor !== undefined)
          organization.settings.branding.secondaryColor =
            settings.branding.secondaryColor;
      }

      organization.markModified("settings");
      changes.after.settings = organization.settings;
    }

    if (billingInfo) {
      organization.billingInfo = {
        ...organization.billingInfo,
        ...billingInfo,
      };
    }

    await organization.save();

    // Log activity
    await logActivity({
      organizationId: id,
      userId: user.userId,
      action: "org_updated",
      changes,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Organization updated successfully",
      data: organization,
    });
  } catch (error) {
    console.error("Update Organization Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete organization (soft delete)
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

    const { id } = await params;

    // Only owner can delete
    const organization = await Organization.findById(id);
    if (!organization) {
      return NextResponse.json(
        { success: false, message: "Organization not found" },
        { status: 404 }
      );
    }

    if (organization.owner.toString() !== user.userId) {
      return NextResponse.json(
        { success: false, message: "Only owner can delete organization" },
        { status: 403 }
      );
    }

    // Soft delete
    organization.isActive = false;
    await organization.save();

    // Deactivate all members
    await TeamMember.updateMany(
      { organization: id },
      { $set: { isActive: false } }
    );

    // Log activity
    await logActivity({
      organizationId: id,
      userId: user.userId,
      action: "org_deleted",
      metadata: { name: organization.name },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (error) {
    console.error("Delete Organization Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
