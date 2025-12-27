import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import { verifyToken } from "@/lib/utils/auth";

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

    const { bookingId, location } = await request.json();

    if (!bookingId || !location || !location.lat || !location.lng) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`📍 Location Update for Booking ${bookingId}:`, location);

    // Update driver location (Ensure mechanic is assigned)
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, assignedMechanic: decoded.userId },
      {
        driverLocation: {
          lat: location.lat,
          lng: location.lng,
          updatedAt: new Date(),
        },
      }
    );

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Location updated",
    });
  } catch (error) {
    console.error("Location update error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
