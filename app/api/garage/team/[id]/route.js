import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import { verifyToken } from "@/lib/utils/auth";
import bcrypt from "bcrypt";

// PATCH: Update a mechanic
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);
    const { id } = await params;

    if (!decoded || decoded.role !== "garage") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, phone, skills } = await request.json();

    const garage = await Garage.findOne({ owner: decoded.userId });
    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    // Verify mechanic belongs to this garage
    const teamMemberIndex = garage.teamMembers.findIndex(
      (m) => m._id.toString() === id || m.user.toString() === id
    );

    if (teamMemberIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Mechanic not found in your team" },
        { status: 404 }
      );
    }

    const member = garage.teamMembers[teamMemberIndex];
    const userId = member.user;

    // Update User Document
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (skills) updateData["mechanicProfile.skills"] = skills;

    await User.findByIdAndUpdate(userId, updateData);

    // Update Garage Team Array
    if (name) garage.teamMembers[teamMemberIndex].name = name;
    if (phone) garage.teamMembers[teamMemberIndex].phone = phone;

    await garage.save();

    return NextResponse.json({
      success: true,
      message: "Mechanic updated successfully",
    });
  } catch (error) {
    console.error("Mechanic PATCH error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a mechanic
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);
    const { id } = await params;

    if (!decoded || decoded.role !== "garage") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const garage = await Garage.findOne({ owner: decoded.userId });
    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    // Find member
    const teamMemberIndex = garage.teamMembers.findIndex(
      (m) => m._id.toString() === id || m.user.toString() === id
    );

    if (teamMemberIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Mechanic not found in your team" },
        { status: 404 }
      );
    }

    const userId = garage.teamMembers[teamMemberIndex].user;

    // Remove from Garage Team
    garage.teamMembers.splice(teamMemberIndex, 1);
    await garage.save();

    // Delete User or Deactivate
    // For now, we prefer deleting if they have no complex history, but safer to just delete user for now as requested
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: "Mechanic removed successfully",
    });
  } catch (error) {
    console.error("Mechanic DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
