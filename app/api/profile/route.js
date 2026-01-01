import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import { verifyToken } from "@/lib/utils/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const profileData = user.toPublicJSON();

    // Attach role-specific data
    if (user.role === "garage") {
      const garage = await Garage.findOne({ owner: user._id });
      profileData.garage = garage;
    } else if (user.role === "mechanic") {
      // Mechanic profile fields are already in the User model
      profileData.mechanicProfile = user.mechanicProfile;
      if (user.garageId) {
        const garage = await Garage.findById(user.garageId).select(
          "name address phone"
        );
        profileData.assignedGarage = garage;
      }
    }

    // Check for Enterprise Role (Member/Admin/Viewer)
    if (user.enterpriseTeam?.parentAccount) {
      const parentUser = await User.findById(
        user.enterpriseTeam.parentAccount
      ).select("enterpriseTeam.members");

      if (parentUser) {
        const memberRecord = parentUser.enterpriseTeam.members.find(
          (m) => m.userId.toString() === user._id.toString()
        );
        if (memberRecord) {
          profileData.enterpriseRole = memberRecord.role; // "admin", "member", or "viewer"
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: profileData,
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      phone,
      address,
      location,
      avatar,
      availability,
      skills,
      vehicles,
      description,
      operatingHours,
      is24Hours,
      vehicleTypes,
      experience,
      specializedEquipments,
      garageImages,
      mechanicDetails,
    } = body;

    // Update User core fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (location) user.location = location;
    if (avatar !== undefined) user.avatar = avatar;
    if (vehicles) user.vehicles = vehicles;

    // Handle role-specific updates
    if (user.role === "mechanic") {
      if (availability) {
        user.availability = {
          ...user.availability,
          status: availability,
          lastUpdated: new Date(),
        };
      }
      if (skills) {
        user.mechanicProfile = {
          ...user.mechanicProfile,
          skills: Array.isArray(skills)
            ? skills
            : skills.split(",").map((s) => s.trim()),
        };
      }
    }

    await user.save();

    // Synchronize with Garage model if user is a garage owner
    if (user.role === "garage") {
      const garageUpdate = {};
      if (name) garageUpdate.name = name;
      if (phone) garageUpdate.phone = phone;
      if (address) garageUpdate.address = address;
      if (location) garageUpdate.location = location;

      // Additional garage-only fields from body
      if (description !== undefined) garageUpdate.description = description;
      if (operatingHours) garageUpdate.operatingHours = operatingHours;
      if (is24Hours !== undefined) garageUpdate.is24Hours = is24Hours;
      if (vehicleTypes) garageUpdate.vehicleTypes = vehicleTypes;
      if (experience) garageUpdate.experience = experience;
      if (specializedEquipments)
        garageUpdate.specializedEquipments = specializedEquipments;
      if (garageImages) garageUpdate.garageImages = garageImages;
      if (mechanicDetails) garageUpdate.mechanicDetails = mechanicDetails;

      if (Object.keys(garageUpdate).length > 0) {
        await Garage.findOneAndUpdate(
          { owner: user._id },
          { $set: garageUpdate },
          { new: true, upsert: true }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
