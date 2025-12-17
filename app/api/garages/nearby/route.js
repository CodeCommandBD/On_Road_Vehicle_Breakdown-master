import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const limit = parseInt(searchParams.get("limit")) || 10;
    const maxDistance = parseInt(searchParams.get("maxDistance")) || 10000; // 10km default

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, message: "Latitude and Longitude are required" },
        { status: 400 }
      );
    }

    const garages = await Garage.findNearby(
      parseFloat(lng),
      parseFloat(lat),
      maxDistance
    )
      .limit(limit)
      .select("name address location rating images phone isVerified is24Hours");

    return NextResponse.json(
      { success: true, count: garages.length, garages },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching nearby garages:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch garages" },
      { status: 500 }
    );
  }
}
