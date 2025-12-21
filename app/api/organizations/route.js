import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Organization from "@/lib/db/models/Organization";
import TeamMember from "@/lib/db/models/TeamMember";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";
import { logActivity } from "@/lib/utils/activity";
import { hasPermission, PERMISSIONS } from "@/lib/utils/permissions";

// GET: List user's organizations
export async function GET(req) {
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

    // Find all organizations where user is a member
    const memberships = await TeamMember.find({
      user: user.userId,
      isActive: true,
    })
      .populate("organization")
      .sort({ joinedAt: -1 });

    const organizations = memberships.map((membership) => ({
      id: membership.organization._id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      role: membership.role,
      memberCount: membership.organization.memberCount,
      isOwner: membership.role === "owner",
      joinedAt: membership.joinedAt,
    }));

    return NextResponse.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error("List Organizations Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

// POST: Create new organization
export async function POST(req) {
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

    // Check if user is Premium or Enterprise
    const userDoc = await User.findById(user.userId);

    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log("User membership tier:", userDoc.membershipTier);

    if (
      userDoc.membershipTier !== "enterprise" &&
      userDoc.membershipTier !== "premium"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Organization creation is only available for Premium and Enterprise users",
        },
        { status: 403 }
      );
    }

    const { name, settings = {}, billingInfo = {} } = await req.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Organization name is required" },
        { status: 400 }
      );
    }

    console.log("Creating organization with name:", name);

    // Manual slug generation as a backup to fix validation error
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Create organization
    const organization = await Organization.create({
      name: name.trim(),
      slug: slug, // Explicitly pass slug
      owner: user.userId,
      settings,
      billingInfo,
    });

    console.log("Organization created:", organization._id);

    // Create team member record for owner
    await TeamMember.create({
      organization: organization._id,
      user: user.userId,
      role: "owner",
      joinedAt: new Date(),
    });

    console.log("Team member record created for owner");

    // Log activity
    try {
      await logActivity({
        organizationId: organization._id,
        userId: user.userId,
        action: "org_created",
        metadata: { name: organization.name },
        req,
      });
    } catch (logError) {
      console.error("Failed to log activity:", logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      data: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
      },
      message: "Organization created successfully",
    });
  } catch (error) {
    console.error("Create Organization Error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    // Send detailed error for debugging
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Server Error",
        error:
          process.env.NODE_ENV === "development"
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
