import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import { verifyToken } from "@/lib/utils/auth";
import Pusher from "pusher"; // Optional: If we want to use Pusher later, but for now we stick to polling DB update

// PATCH: Update driver location
export async function PATCH(request, { params }) {
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

    // Only Garage or Admin can update driver location
    if (decoded.role !== "garage" && decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Only garage or admin can update location" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, message: "Latitude and Longitude required" },
        { status: 400 }
      );
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      {
        $set: {
          driverLocation: {
            lat,
            lng,
            updatedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking.driverLocation,
    });
  } catch (error) {
    console.error("Tracking Update Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
