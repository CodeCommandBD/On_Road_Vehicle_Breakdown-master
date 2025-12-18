import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";

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
    const { email, push, serviceReminders } = body;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update notification preferences
    user.notificationPreferences = {
      email:
        typeof email === "boolean" ? email : user.notificationPreferences.email,
      push:
        typeof push === "boolean" ? push : user.notificationPreferences.push,
      serviceReminders:
        typeof serviceReminders === "boolean"
          ? serviceReminders
          : user.notificationPreferences.serviceReminders,
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Notification preferences updated successfully",
      preferences: user.notificationPreferences,
    });
  } catch (error) {
    console.error("Settings Notifications PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
