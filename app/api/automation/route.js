import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Integration from "@/lib/db/models/Integration";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import TeamMember from "@/lib/db/models/TeamMember";
import { verifyToken } from "@/lib/utils/auth";

/**
 * Access Control Helper
 */
const checkAccess = async (user) => {
  if (!user) return false;
  if (user.role === "admin") return true;

  const allowedTiers = ["standard", "premium", "enterprise"];
  if (allowedTiers.includes(user.membershipTier)) return true;

  // Check if team member of an enterprise organization
  const teamMembership = await TeamMember.findOne({
    user: user._id,
    isActive: true,
  });

  if (teamMembership) {
    // For now, if they are in a team, we consider them as having the organization's access.
    // In a more complex system, we would check the organization's specific tier.
    // Based on the sidebar log, team members are treated as 'enterprise'.
    return true;
  }

  return false;
};

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;
    const decoded = await verifyToken(token);
    if (!decoded)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user)
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );

    if (!(await checkAccess(user))) {
      return NextResponse.json(
        { success: false, error: "Upgrade required to access automation" },
        { status: 403 }
      );
    }

    const query = {};
    if (user.role === "garage") {
      const garage = await Garage.findOne({ owner: user._id });
      if (garage) query.garage = garage._id;
      else query.user = user._id;
    } else if (user.role === "admin") {
      // Admin sees all or can filter via params (simplified for now)
    } else {
      query.user = user._id;
    }

    const integration = await Integration.findOne(query);
    return NextResponse.json({ success: true, data: integration });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const token = req.cookies.get("token")?.value;
    const decoded = await verifyToken(token);
    if (!decoded)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    const { webhookUrl, events, isActive, payloadFormat } = await req.json();

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!(await checkAccess(user))) {
      return NextResponse.json(
        { success: false, error: "Upgrade required" },
        { status: 403 }
      );
    }

    const query = {};
    const updateData = { webhookUrl, events, isActive, payloadFormat };

    if (user.role === "garage") {
      const garage = await Garage.findOne({ owner: user._id });
      if (garage) {
        query.garage = garage._id;
        updateData.garage = garage._id;
      } else {
        query.user = user._id;
        updateData.user = user._id;
      }
    } else {
      query.user = user._id;
      updateData.user = user._id;
    }

    const integration = await Integration.findOneAndUpdate(
      query,
      { $set: updateData },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: integration });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const token = req.cookies.get("token")?.value;
    const decoded = await verifyToken(token);
    if (!decoded)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    await connectDB();
    const user = await User.findById(decoded.userId);

    const query = {};
    if (user.role === "garage") {
      const garage = await Garage.findOne({ owner: user._id });
      if (garage) query.garage = garage._id;
      else query.user = user._id;
    } else {
      query.user = user._id;
    }

    await Integration.deleteOne(query);
    return NextResponse.json({ success: true, message: "Integration deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const token = req.cookies.get("token")?.value;
    const decoded = await verifyToken(token);
    if (!decoded)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!(await checkAccess(user))) {
      return NextResponse.json(
        { success: false, error: "Upgrade required" },
        { status: 403 }
      );
    }

    const query = {};
    if (user.role === "garage") {
      const garage = await Garage.findOne({ owner: user._id });
      if (garage) query.garage = garage._id;
      else query.user = user._id;
    } else {
      query.user = user._id;
    }

    const integration = await Integration.findOne(query);

    if (!integration) {
      return NextResponse.json(
        { success: false, error: "No integration found" },
        { status: 404 }
      );
    }

    // Save old secret to history
    const oldSecret = integration.secret;
    integration.secretRotationHistory.push({
      oldSecret: oldSecret,
      rotatedAt: new Date(),
    });

    // Generate new secret
    integration.secret =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    integration.secretRotatedAt = new Date();

    // Keep only last 5 rotations in history
    if (integration.secretRotationHistory.length > 5) {
      integration.secretRotationHistory =
        integration.secretRotationHistory.slice(-5);
    }

    await integration.save();

    return NextResponse.json({
      success: true,
      message: "Secret rotated successfully",
      data: integration,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
