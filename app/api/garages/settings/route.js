import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";
import bcrypt from "bcrypt";

// GET /api/garages/settings - Get account & garage settings
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

    const user = await User.findById(decoded.userId).select("-password");
    const garage = await Garage.findOne({ owner: decoded.userId });

    if (!user || !garage) {
      return NextResponse.json(
        { success: false, message: "Account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        account: {
          isActive: user.isActive,
          notificationPreferences: user.notificationPreferences,
          email: user.email,
          role: user.role,
        },
        garage: {
          isActive: garage.isActive,
          isVerified: garage.isVerified,
          name: garage.name,
        },
      },
    });
  } catch (error) {
    console.error("Settings Fetch Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/garages/settings - Update settings
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
    const {
      notificationPreferences,
      garageActive,
      accountActive,
      currentPassword,
      newPassword,
    } = body;

    const user = await User.findById(decoded.userId).select("+password");
    const garage = await Garage.findOne({ owner: decoded.userId });

    if (!user || !garage) {
      return NextResponse.json(
        { success: false, message: "Account not found" },
        { status: 404 }
      );
    }

    // Handle Password Change if requested
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: "Current password incorrect" },
          { status: 400 }
        );
      }
      user.password = newPassword; // Pre-save hook will hash it
    }

    // Update User settings
    if (notificationPreferences) {
      user.notificationPreferences = notificationPreferences;
    }

    if (accountActive !== undefined) {
      user.isActive = accountActive;
    }

    await user.save();

    // Update Garage settings
    if (garageActive !== undefined) {
      garage.isActive = garageActive;
      await garage.save();
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Settings Update Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
