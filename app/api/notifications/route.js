import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Notification from "@/lib/db/models/Notification";

import SOS from "@/lib/db/models/SOS";
import Garage from "@/lib/db/models/Garage";
import { verifyToken } from "@/lib/utils/auth";
import { pusherServer } from "@/lib/pusher";

import { csrfProtection } from "@/lib/utils/csrf";

// Helper to trigger real-time notification
const notifyUser = async (userId, notification) => {
  try {
    await pusherServer.trigger(`user-${userId}`, "notification", {
      message: notification.message,
      title: notification.title,
      link: notification.link,
      createdAt: notification.createdAt,
    });
  } catch (error) {
    console.error("Pusher Trigger Error:", error);
  }
};

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    await connectDB();

    let finalNotifications = [];
    let extraUnread = 0;

    // If user is a garage, dynamically check for pending SOS alerts OR alerts assigned to them
    if (decoded.role === "garage") {
      try {
        const garage = await Garage.findOne({ owner: decoded.userId });

        const sosQueries = [
          { status: "pending" }, // All garages see pending
        ];

        if (garage) {
          sosQueries.push({ status: "assigned", assignedGarage: garage._id }); // My assigned alerts
        }

        const relevantSos = await SOS.find({
          $or: sosQueries,
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        relevantSos.forEach((sos) => {
          const isAssignedToMe = sos.status === "assigned";
          finalNotifications.push({
            _id: "sos-" + sos._id,
            title: isAssignedToMe
              ? "🛠️ YOUR ASSIGNED SOS"
              : "🚨 PENDING SOS ALERT",
            message: isAssignedToMe
              ? `Active mission: ${sos.location?.address || "Go to location"}`
              : `${sos.location?.address || "Someone"} needs help!`,
            link: `/garage/sos-navigation/${sos._id}`,
            createdAt: sos.createdAt,
            isRead: false,
            isSos: true,
          });
          extraUnread++;
        });
      } catch (garageError) {
        console.error("Error fetching garage SOS:", garageError);
        // Continue without SOS notifications
      }
    }

    const dbNotifications = await Notification.find({
      recipient: decoded.userId,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const dbUnreadCount = await Notification.countDocuments({
      recipient: decoded.userId,
      isRead: false,
    });

    // Dynamic status notifications based on role
    if (decoded.role === "garage") {
      finalNotifications.unshift({
        _id: "system-check-garage",
        title: "📡 SOS SYSTEM ACTIVE",
        message: "You are connected to the live emergency network.",
        link: "/garage/dashboard",
        createdAt: new Date(),
        isRead: false,
      });
    } else if (decoded.role === "admin") {
      finalNotifications.unshift({
        _id: "system-check-admin",
        title: "🛡️ ADMIN OVERWATCH ACTIVE",
        message:
          "System monitoring and emergency protocols are fully operational.",
        link: "/admin/dashboard",
        createdAt: new Date(),
        isRead: false,
      });
    }

    // Finalize and sort notifications
    finalNotifications = [...finalNotifications, ...dbNotifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
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
      { status: 500 },
    );
  }
}

export async function PATCH(req) {
  try {
    const csrfError = csrfProtection(req);
    if (csrfError) {
      return NextResponse.json(
        { success: false, message: csrfError.message },
        { status: csrfError.status },
      );
    }
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );

    await connectDB();

    const { id, markAllAsRead } = await req.json();

    if (markAllAsRead) {
      await Notification.updateMany(
        { recipient: decoded.userId, isRead: false },
        { isRead: true },
      );
    } else if (id) {
      await Notification.findOneAndUpdate(
        { _id: id, recipient: decoded.userId },
        { isRead: true },
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
      { status: 500 },
    );
  }
}
