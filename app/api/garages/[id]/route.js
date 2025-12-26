import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";
import Service from "@/lib/db/models/Service"; // Ensure Service model is registered

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const garage = await Garage.findById(id)
      .populate("services")
      .populate("owner", "name email phone avatar") // Populate owner info if public/needed
      .lean();

    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    // Increment view count if we want to track popularity later?
    // For now, just return data.

    return NextResponse.json({
      success: true,
      data: garage,
    });
  } catch (error) {
    console.error("Error fetching garage details:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
