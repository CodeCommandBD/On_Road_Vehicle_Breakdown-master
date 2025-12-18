import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Notification from "@/lib/db/models/Notification";
import { verifyToken } from "@/lib/utils/helpers";

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    await connectDB();

    const notifications = await Notification.find({ recipient: decoded.id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      recipient: decoded.id,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Notifications Fetch Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    await connectDB();

    const { id, markAllAsRead } = await req.json();

    if (markAllAsRead) {
      await Notification.updateMany(
        { recipient: decoded.id, isRead: false },
        { isRead: true }
      );
    } else if (id) {
      await Notification.findOneAndUpdate(
        { _id: id, recipient: decoded.id },
        { isRead: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notifications updated",
    });
  } catch (error) {
    console.error("Notifications Update Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
