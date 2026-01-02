import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import { verifyToken } from "@/lib/utils/auth";
import bcrypt from "bcrypt";

// GET: List all team members
export async function GET(request) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "garage") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const garage = await Garage.findOne({ owner: decoded.userId }).populate({
      path: "teamMembers.user",
      select: "name email phone avatar mechanicProfile availability",
    });

    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      teamMembers: garage.teamMembers,
    });
  } catch (error) {
    console.error("Team GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Add new mechanic
export async function POST(request) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "garage") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, password, skills, email } = body;

    // Validation
    if (!name || !phone || !password) {
      return NextResponse.json(
        { success: false, message: "Name, Phone and Password are required" },
        { status: 400 }
      );
    }

    const garage = await Garage.findOne({ owner: decoded.userId });
    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ phone }, { email: email || "placeholder" }],
    });

    if (existingUser) {
      // Self-healing: If user exists, is a mechanic, belongs to this garage, but NOT in team list
      // This happens if User was created but Garage update failed previously
      if (
        existingUser.role === "mechanic" &&
        existingUser.garageId?.toString() === garage._id.toString()
      ) {
        const alreadyInTeam = garage.teamMembers.some(
          (member) => member.user.toString() === existingUser._id.toString()
        );

        if (!alreadyInTeam) {
          // Update the existing orphaned user with new details
          existingUser.name = name;
          if (email) existingUser.email = email;
          existingUser.password = password; // Will be hashed by pre-save hook
          existingUser.mechanicProfile = { skills: skills || [] };
          await existingUser.save();

          // Add to garage team
          garage.teamMembers.push({
            user: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            phone: existingUser.phone,
            initialPassword: password,
            role: "mechanic",
            isActive: true,
          });

          await garage.save();

          return NextResponse.json({
            success: true,
            message: "Mechanic recovered and added successfully",
            mechanic: {
              _id: existingUser._id,
              name: existingUser.name,
              phone: existingUser.phone,
            },
          });
        }
      }

      return NextResponse.json(
        {
          success: false,
          message: "User with this phone/email already exists",
        },
        { status: 400 }
      );
    }

    // Create Mechanic User
    // If email is not provided, generate a fake one for uniqueness constraint
    const finalEmail = email || `${phone}@${garage._id}.local`;

    const newMechanic = await User.create({
      name,
      email: finalEmail,
      phone,
      password, // Password will be hashed by pre-save hook
      role: "mechanic",
      garageId: garage._id,
      membershipTier: "free", // Mechanics don't need paid tiers
      mechanicProfile: {
        skills: skills || [],
      },
    });

    // Add to Garage Team
    garage.teamMembers.push({
      user: newMechanic._id,
      name: newMechanic.name,
      email: newMechanic.email,
      phone: newMechanic.phone,
      initialPassword: password, // Store plain text for owner reference
      role: "mechanic",
      isActive: true,
    });

    await garage.save();

    return NextResponse.json({
      success: true,
      message: "Mechanic added successfully",
      mechanic: {
        _id: newMechanic._id,
        name: newMechanic.name,
        phone: newMechanic.phone,
      },
    });
  } catch (error) {
    console.error("Team POST error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
