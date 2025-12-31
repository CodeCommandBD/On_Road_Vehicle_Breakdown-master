import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Notification from "@/lib/db/models/Notification";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";
import Garage from "@/lib/db/models/Garage";
import { sendMechanicSOSEmail } from "@/lib/utils/email";

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

    const garage = await Garage.findById(mechanic.garageId).populate("owner");

    // Create Critical Notification for Garage Owner
    await Notification.create({
      recipient: garage.owner._id,
      type: "system_alert",
      title: "🚨 SOS ALERT: Mechanic in Danger",
      message: `${mechanic.name} has triggered an emergency SOS!`,
      link: `/garage/dashboard/team`,
      metadata: {
        coordinates: location,
        type: "sos",
        mechanicId: mechanic._id,
      },
      isRead: false,
    });

    // Send Email notification to Garage Owner
    const emailResult = await sendMechanicSOSEmail({
      to: garage.owner.email,
      mechanicName: mechanic.name,
      location: location,
      garageOwnerName: garage.owner.name,
      mechanicPhone: mechanic.phone,
    });

    // Log email result (success or failure)
    if (emailResult.success) {
      console.log(`✅ SOS email sent to garage owner: ${garage.owner.email}`);
    } else {
      console.error(`❌ Failed to send SOS email: ${emailResult.error}`);
    }

    return NextResponse.json({
      success: true,
      message: "SOS Alert Sent!",
      emailStatus: emailResult.success ? "sent" : "failed",
    });
  } catch (error) {
    console.error("SOS API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
