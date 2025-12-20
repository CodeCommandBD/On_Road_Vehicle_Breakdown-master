import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import SOS from "@/lib/db/models/SOS";
import Garage from "@/lib/db/models/Garage";
import Notification from "@/lib/db/models/Notification";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";
import { sendSOSEmail, sendAssignmentEmail } from "@/lib/utils/email";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login again." },
        { status: 401 }
      );
    }

    const { latitude, longitude, address, phone, vehicleType } = body;

    // Validation
    if (!latitude || !longitude || !phone) {
      return NextResponse.json(
        { success: false, message: "Location and phone are required" },
        { status: 400 }
      );
    }

    const sosAlert = await SOS.create({
      user: decoded.userId,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
        address: address || "Location from GPS",
      },
      phone,
      vehicleType: vehicleType || "other",
      status: "pending",
    });

    // Create notifications and send emails
    try {
      const user = await User.findById(decoded.userId);
      const garages = await Garage.find({}).populate("owner");

      const emailPromises = garages.map((g) => {
        if (g.owner?.email) {
          return sendSOSEmail(g.owner.email, {
            userName: user?.name || "A User",
            location: address || "GPS Location",
            phone: phone,
            vehicleType: vehicleType,
          });
        }
        return null;
      });

      const notificationPromises = garages.map((g) =>
        Notification.create({
          recipient: g.owner?._id || g.owner,
          type: "system_alert",
          title: "🚨 EMERGENCY SOS ALERT",
          message: `${
            user?.name || "A user"
          } needs immediate help! Check the SOS dashboard.`,
          link: `/garage/sos-navigation/${sosAlert._id}`,
        })
      );

      // Also notify all admins
      const admins = await User.find({ role: "admin" }).select("_id");
      const adminNotificationPromises = admins.map((admin) =>
        Notification.create({
          recipient: admin._id,
          type: "system_alert",
          title: "🚨 GLOBAL SOS ALERT",
          message: `${user?.name || "A user"} reported an emergency: ${
            address || "GPS Location"
          }`,
          link: `/admin/dashboard`, // Admin sees all SOS in dashboard
        })
      );

      await Promise.all([
        ...notificationPromises,
        ...adminNotificationPromises,
        ...emailPromises,
      ]);
    } catch (notifyErr) {
      console.error("Failed to send SOS alerts:", notifyErr);
    }

    return NextResponse.json({
      success: true,
      data: sosAlert,
      message: "Emergency alert sent successfully. Help is on the way!",
    });
  } catch (error) {
    console.error("SOS POST Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const query = {};

    // Role-based filtering
    if (decoded.role === "admin") {
      if (status)
        query.status = status.includes(",")
          ? { $in: status.split(",") }
          : status;
    } else if (decoded.role === "garage") {
      const garage = await Garage.findOne({ owner: decoded.userId });
      if (!garage) {
        return NextResponse.json(
          { success: false, message: "Garage not found" },
          { status: 404 }
        );
      }

      if (status) {
        const statuses = status.split(",");
        const orConditions = [];

        // Common status like 'pending' (anyone in role can see)
        const generalStatuses = statuses.filter(
          (s) => s !== "assigned" && s !== "resolved"
        );
        if (generalStatuses.length > 0) {
          orConditions.push({ status: { $in: generalStatuses } });
        }

        // Sensitive status like 'assigned' or 'resolved' (only see my own)
        if (statuses.includes("assigned")) {
          orConditions.push({ status: "assigned", assignedGarage: garage._id });
        }
        if (statuses.includes("resolved")) {
          orConditions.push({ status: "resolved", assignedGarage: garage._id });
        }

        if (orConditions.length > 0) {
          query.$or = orConditions;
        }
      }
    } else {
      // User can only see their own
      query.user = decoded.userId;
      if (status) {
        query.status = status.includes(",")
          ? { $in: status.split(",") }
          : status;
      } else {
        query.status = { $ne: "cancelled" }; // Default for user
      }
    }

    const alerts = await SOS.find(query)
      .populate("user", "name phone email")
      .populate("assignedGarage", "name phone location")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error("CRITICAL SOS GET ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login again." },
        { status: 401 }
      );
    }

    const { sosId, status, garageId } = await request.json();

    if (!sosId) {
      return NextResponse.json(
        { success: false, message: "SOS ID is required" },
        { status: 400 }
      );
    }

    const sos = await SOS.findById(sosId);
    if (!sos) {
      return NextResponse.json(
        { success: false, message: "SOS alert not found" },
        { status: 404 }
      );
    }

    // Role-based logic
    if (decoded.role === "admin") {
      // Admin can assign, resolve, or cancel
      if (status) sos.status = status;
      if (garageId) {
        sos.assignedGarage = garageId;
        sos.status = "assigned";
        sos.assignedAt = new Date();

        // Send Email to the assigned garage
        try {
          const garage = await Garage.findById(garageId).populate("owner");
          const user = await User.findById(sos.user);
          if (garage && garage.owner?.email) {
            await sendAssignmentEmail(garage.owner.email, garage.name, {
              userName: user?.name || "User",
              location: sos.location?.address || "Location",
              phone: sos.phone,
            });
          }
        } catch (err) {
          console.error("Assignment email error:", err);
        }
      }
      if (status === "resolved") sos.resolvedAt = new Date();
    } else if (decoded.role === "garage") {
      // Garage can only accept if it's pending, or mark as resolved if assigned to them
      const garage = await Garage.findOne({ owner: decoded.userId });
      if (!garage) {
        return NextResponse.json(
          { success: false, message: "Garage profile not found" },
          { status: 404 }
        );
      }

      if (status === "assigned") {
        if (sos.status !== "pending") {
          return NextResponse.json(
            { success: false, message: "This alert has already been taken" },
            { status: 400 }
          );
        }
        sos.assignedGarage = garage._id;
        sos.status = "assigned";
        sos.assignedAt = new Date();
      } else if (status === "resolved") {
        if (
          !sos.assignedGarage ||
          sos.assignedGarage.toString() !== garage._id.toString()
        ) {
          return NextResponse.json(
            { success: false, message: "You are not assigned to this alert" },
            { status: 403 }
          );
        }
        sos.status = "resolved";
        sos.resolvedAt = new Date();
      } else {
        return NextResponse.json(
          { success: false, message: "Forbidden transition for garage role" },
          { status: 403 }
        );
      }
    } else {
      // User can cancel their own SOS
      if (status === "cancelled") {
        if (sos.user.toString() !== decoded.userId) {
          return NextResponse.json(
            { success: false, message: "Unauthorized to cancel" },
            { status: 403 }
          );
        }
        sos.status = "cancelled";
      } else {
        return NextResponse.json(
          { success: false, message: "Unauthorized action" },
          { status: 403 }
        );
      }
    }

    await sos.save();

    return NextResponse.json({
      success: true,
      message: `SOS alert updated to ${sos.status}`,
      data: sos,
    });
  } catch (error) {
    console.error("SOS PATCH error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
