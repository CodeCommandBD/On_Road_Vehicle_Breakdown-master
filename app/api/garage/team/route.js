import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";

// GET - List team members
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get("garageId");

    if (!garageId) {
      return NextResponse.json(
        { success: false, message: "Garage ID is required" },
        { status: 400 }
      );
    }

    const garage = await Garage.findById(garageId)
      .populate("teamMembers.user", "name email")
      .lean();

    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        teamMembers: garage.teamMembers || [],
        membershipTier: garage.membershipTier,
      },
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch team members",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Add team member
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { garageId, name, email, phone, role } = body;

    if (!garageId || !name || !email) {
      return NextResponse.json(
        { success: false, message: "Garage ID, name, and email are required" },
        { status: 400 }
      );
    }

    const garage = await Garage.findById(garageId);

    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    // Check team member limits based on tier
    const limits = {
      free: 1, // Only owner
      trial: 1,
      basic: 3,
      standard: 5,
      premium: 10,
      enterprise: -1, // Unlimited
    };

    const currentLimit = limits[garage.membershipTier] || 1;
    const currentCount = garage.teamMembers?.length || 0;

    if (currentLimit !== -1 && currentCount >= currentLimit) {
      return NextResponse.json(
        {
          success: false,
          message: `Team member limit reached for ${garage.membershipTier} plan. Upgrade to add more members.`,
          limit: currentLimit,
        },
        { status: 403 }
      );
    }

    // Add new member
    const newMember = {
      name,
      email,
      phone,
      role: role || "mechanic",
      addedAt: new Date(),
      isActive: true,
    };

    if (!garage.teamMembers) {
      garage.teamMembers = [];
    }

    garage.teamMembers.push(newMember);
    await garage.save();

    return NextResponse.json({
      success: true,
      data: { member: newMember },
      message: "Team member added successfully",
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add team member",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update team member
export async function PUT(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { garageId, memberId, name, email, phone, role, isActive } = body;

    if (!garageId || !memberId) {
      return NextResponse.json(
        { success: false, message: "Garage ID and Member ID are required" },
        { status: 400 }
      );
    }

    const garage = await Garage.findById(garageId);

    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    const member = garage.teamMembers.id(memberId);

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Team member not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (name) member.name = name;
    if (email) member.email = email;
    if (phone) member.phone = phone;
    if (role) member.role = role;
    if (typeof isActive !== "undefined") member.isActive = isActive;

    await garage.save();

    return NextResponse.json({
      success: true,
      data: { member },
      message: "Team member updated successfully",
    });
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update team member",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove team member
export async function DELETE(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get("garageId");
    const memberId = searchParams.get("memberId");

    if (!garageId || !memberId) {
      return NextResponse.json(
        { success: false, message: "Garage ID and Member ID are required" },
        { status: 400 }
      );
    }

    const garage = await Garage.findById(garageId);

    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    garage.teamMembers.pull(memberId);
    await garage.save();

    return NextResponse.json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove team member",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
