import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import SOS from "@/lib/db/models/SOS";
import { verifyToken } from "@/lib/utils/auth";

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { latitude, longitude, address, phone, vehicleType } = body;

    const sosAlert = await SOS.create({
      user: decoded.userId,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
        address,
      },
      phone,
      vehicleType,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      data: sosAlert,
      message: "Emergency alert sent successfully. Help is on the way!",
    });
  } catch (error) {
    console.error("SOS POST error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || (decoded.role !== "admin" && decoded.role !== "garage")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const query = {};
    if (status) query.status = status;

    const alerts = await SOS.find(query)
      .populate("user", "name phone email")
      .populate("assignedGarage", "name phone")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error("SOS GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
