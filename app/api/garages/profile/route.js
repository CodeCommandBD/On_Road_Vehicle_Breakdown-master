import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";
import { verifyToken } from "@/lib/utils/auth";

// GET /api/garages/profile - Get garage profile for authenticated garage owner
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

    // Find garage by owner ID
    const garage = await Garage.findOne({ owner: decoded.userId }).populate(
      "services",
      "name category icon"
    );

    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        garage: {
          _id: garage._id,
          name: garage.name,
          email: garage.email,
          phone: garage.phone,
          description: garage.description,
          address: garage.address,
          location: garage.location,
          rating: garage.rating,
          services: garage.services,
          is24Hours: garage.is24Hours,
          operatingHours: garage.operatingHours,
          vehicleTypes: garage.vehicleTypes,
          totalBookings: garage.totalBookings,
          completedBookings: garage.completedBookings,
          isVerified: garage.isVerified,
          logo: garage.logo,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Garage profile fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
