import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import { verifyToken } from "@/lib/utils/auth";
import fs from "fs";

const logFile =
  "c:/Users/Shanto/Downloads/Compressed/project/real project/full stack/On_Road_Vehicle_Breakdown-master/debug.log";
const log = (msg) => {
  try {
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
  } catch (e) {}
};

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

    let garage = null;
    if (user.role === "garage") {
      garage = await Garage.findOne({ owner: user._id });
    }

    return NextResponse.json({
      success: true,
      user: user.toPublicJSON(),
      garage: garage,
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

    const body = await request.json();
    const body = await request.json();
    const { name, phone, address, location, vehicles, garageData, avatar } =
      body;
    console.log(
      `API PUT /api/user/profile - Received request. Avatar: ${!!avatar}`
    );
    if (location) console.log("Received location update:", location);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (location) updateData.location = location;
    if (vehicles) updateData.vehicles = vehicles;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Perform atomic update
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    console.log(
      "User updated in DB. New location:",
      JSON.stringify(updatedUser?.location)
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update garage fields if applicable
    if (updatedUser.role === "garage" && garageData) {
      await Garage.findOneAndUpdate(
        { owner: updatedUser._id },
        {
          $set: {
            name: garageData.name,
            phone: garageData.phone,
            description: garageData.description,
            address: garageData.address,
            is24Hours: garageData.is24Hours,
            vehicleTypes: garageData.vehicleTypes,
          },
        },
        { new: true, upsert: true }
      );
    }

    log(`PUT /api/user/profile - updatedUser name: ${updatedUser?.name}`);
    log(
      `PUT /api/user/profile - updatedUser location: ${JSON.stringify(
        updatedUser?.location
      )}`
    );
    const publicUser = updatedUser.toPublicJSON();
    log(`PUT /api/user/profile - publicUser: ${JSON.stringify(publicUser)}`);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      debug_field: "v2_logging",
      debug_user_raw: {
        name: updatedUser.name,
        location: updatedUser.location,
        keys: Object.keys(updatedUser.toObject()),
      },
      user: publicUser,
    });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
