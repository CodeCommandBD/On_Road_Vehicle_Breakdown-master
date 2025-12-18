import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";

// Middleware-like check for admin
async function checkAdmin(request) {
  const token = request.cookies.get("token")?.value;
  const decoded = await verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

// GET /api/admin/garages - List all garages for admin
export async function GET(request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin)
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );

    await connectDB();

    const garages = await Garage.find()
      .populate("owner", "name email phone isVerified")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      garages: garages.map((g) => ({
        _id: g._id,
        name: g.name,
        email: g.email,
        phone: g.phone,
        status: g.isActive ? (g.isVerified ? "active" : "pending") : "inactive",
        address: g.address,
        location: g.location,
        vehicleTypes: g.vehicleTypes,
        verification: g.verification,
        experience: g.experience,
        specializedEquipments: g.specializedEquipments,
        garageImages: g.garageImages,
        mechanicDetails: g.mechanicDetails,
        isVerified: g.isVerified,
        ownerName: g.owner?.name || "Unknown",
        createdAt: g.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin Garage Fetch Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/garages - Update garage status/verification
export async function PUT(request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin)
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );

    await connectDB();
    const { garageId, isVerified, isActive } = await request.json();

    if (!garageId) {
      return NextResponse.json(
        { success: false, message: "Garage ID required" },
        { status: 400 }
      );
    }

    const garage = await Garage.findById(garageId);
    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    if (isVerified !== undefined) garage.isVerified = isVerified;
    if (isActive !== undefined) garage.isActive = isActive;

    await garage.save();

    return NextResponse.json({
      success: true,
      message: "Garage updated successfully",
      garage,
    });
  } catch (error) {
    console.error("Admin Garage Update Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
