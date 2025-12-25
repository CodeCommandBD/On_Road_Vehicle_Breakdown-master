import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Notification from "@/lib/db/models/Notification";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";
import Garage from "@/lib/db/models/Garage";

export async function POST(request) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "mechanic") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { location } = await request.json(); // { lat, lng }
    const mechanic = await User.findById(decoded.userId);

    if (!mechanic.garageId) {
      return NextResponse.json(
        { success: false, message: "No garage linked" },
        { status: 400 }
      );
    }

    const garage = await Garage.findById(mechanic.garageId);

    // Create Critical Notification for Garage Owner
    await Notification.create({
      recipient: garage.owner,
      type: "system_alert", // Could be 'sos_alert' if allowed, sticking to enum
      title: "🚨 SOS ALERT: Mechanic in Danger",
      message: `${mechanic.name} has triggered an emergency SOS!`,
      link: `/garage/dashboard/team`, // Or a specific map view
      metadata: {
        coordinates: location,
        type: "sos",
        mechanicId: mechanic._id,
      },
      isRead: false,
    });

    // TODO: Integrate SMS/Twilio here for real-world urgency

    return NextResponse.json({
      success: true,
      message: "SOS Alert Sent!",
    });
  } catch (error) {
    console.error("SOS API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
