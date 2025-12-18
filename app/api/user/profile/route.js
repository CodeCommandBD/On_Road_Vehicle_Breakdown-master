import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import { verifyToken } from "@/lib/utils/auth";

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
    const { name, phone, address, vehicles, garageData } = body;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update user fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (vehicles) user.vehicles = vehicles;

    await user.save();

    // Update garage fields if applicable
    if (user.role === "garage" && garageData) {
      await Garage.findOneAndUpdate(
        { owner: user._id },
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

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
