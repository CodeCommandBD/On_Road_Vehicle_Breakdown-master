import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";
import { verifyToken } from "@/lib/utils/auth";

export async function GET(request) {
  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "garage") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const garage = await Garage.findOne({ owner: decoded.userId })
      .populate("services")
      .populate("owner", "name email phone avatar");

    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      garage,
    });
  } catch (error) {
    console.error("Error fetching garage profile:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
