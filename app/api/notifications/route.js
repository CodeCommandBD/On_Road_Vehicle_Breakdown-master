import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Notification from "@/lib/db/models/Notification";
import SOS from "@/lib/db/models/SOS";
import Garage from "@/lib/db/models/Garage";
import { verifyToken } from "@/lib/utils/auth";

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
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    await connectDB();

    let finalNotifications = [];
    let extraUnread = 0;

    // If user is a garage, dynamically check for pending SOS alerts
    if (decoded.role === "garage") {
      const pendingSos = await SOS.find({ status: "pending" })
        .sort({ createdAt: -1 })
        .limit(5);

      pendingSos.forEach((sos) => {
        finalNotifications.push({
          _id: "sos-" + sos._id,
          title: "🚨 PENDING SOS ALERT",
          message: `${sos.location?.address || "Someone"} needs help!`,
          link: "/garage/dashboard",
          createdAt: sos.createdAt,
          isRead: false,
          isSos: true,
        });
        extraUnread++;
      });
    }

    const dbNotifications = await Notification.find({
      recipient: decoded.userId,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const dbUnreadCount = await Notification.countDocuments({
      recipient: decoded.userId,
      isRead: false,
    });

    // Always add a "System Ready" notification for garages to confirm the pipeline is working
    if (decoded.role === "garage") {
      finalNotifications.unshift({
        _id: "system-check",
        title: "📡 NOTIFICATION SYSTEM ONLINE",
        message: "You will receive real-time SOS alerts here.",
        link: "/garage/dashboard",
        createdAt: new Date(),
        isRead: false,
      });
    }

    // Add a hardcoded notification for testing/demonstration purposes
    finalNotifications.unshift({
      _id: "hardcoded-test-notification",
      title: "Test Notification",
      message: "This is a hardcoded test notification.",
      link: "/test",
      createdAt: new Date(),
      isRead: false,
    });
    extraUnread++; // Increment unread count for the hardcoded notification

    finalNotifications = [...finalNotifications, ...dbNotifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    console.log("SENDING NOTIFICATIONS:", {
      role: decoded.role,
      count: finalNotifications.length,
      unread: dbUnreadCount + extraUnread,
      source: "API GET route",
    });

    return NextResponse.json({
      success: true,
      notifications: finalNotifications,
      unreadCount: dbUnreadCount + extraUnread,
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
    if (!decoded || !decoded.userId)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    await connectDB();

    const { id, markAllAsRead } = await req.json();

    if (markAllAsRead) {
      await Notification.updateMany(
        { recipient: decoded.userId, isRead: false },
        { isRead: true }
      );
    } else if (id) {
      await Notification.findOneAndUpdate(
        { _id: id, recipient: decoded.userId },
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
