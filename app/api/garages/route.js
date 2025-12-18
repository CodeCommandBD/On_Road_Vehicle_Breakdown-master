import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";
import Service from "@/lib/db/models/Service";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const isActive = searchParams.get("isActive") === "true";
    const isVerified = searchParams.get("isVerified") === "true";
    const sort = searchParams.get("sort") || "rating";

    // Build query
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive;
    }
    if (isVerified !== undefined) {
      query.isVerified = isVerified;
    }

    // Build sort object
    let sortObj = {};
    if (sort === "rating") {
      sortObj = { "rating.average": -1, "rating.count": -1 };
    } else if (sort === "bookings") {
      sortObj = { completedBookings: -1 };
    } else if (sort === "name") {
      sortObj = { name: 1 };
    } else {
      sortObj = { createdAt: -1 };
    }

    // Fetch garages
    const garages = await Garage.find(query)
      .populate("services", "name category")
      .sort(sortObj)
      .limit(limit)
      .lean();

    const total = await Garage.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        garages,
        total,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching garages:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch garages",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
