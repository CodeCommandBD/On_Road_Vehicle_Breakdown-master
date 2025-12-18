import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";
import Service from "@/lib/db/models/Service";
import { verifyToken } from "@/lib/utils/auth";

// PUT /api/garages/services - Update garage services
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

    const { serviceIds } = await request.json();

    if (!Array.isArray(serviceIds)) {
      return NextResponse.json(
        { success: false, message: "Invalid service data" },
        { status: 400 }
      );
    }

    // Find garage by owner ID
    const garage = await Garage.findOne({ owner: decoded.userId });

    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    // Update garage services
    garage.services = serviceIds;
    await garage.save();

    // Return updated garage with populated services
    const updatedGarage = await Garage.findById(garage._id).populate(
      "services",
      "name category icon basePrice"
    );

    return NextResponse.json(
      {
        success: true,
        message: "Services updated successfully",
        garage: updatedGarage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating garage services:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
