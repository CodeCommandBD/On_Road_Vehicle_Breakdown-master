import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";
import Service from "@/lib/db/models/Service";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));
    const maxDistance = parseInt(searchParams.get("distance") || "10000"); // 10km default
    const limit = parseInt(searchParams.get("limit") || "20");
    const sort = searchParams.get("sort") || "latest";

    // Build query
    const query = {};
    if (searchParams.get("isActive")) {
      query.isActive = searchParams.get("isActive") === "true";
    }
    if (searchParams.get("isVerified")) {
      query.isVerified = searchParams.get("isVerified") === "true";
    }

    // Text search
    const search = searchParams.get("search");
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { "address.city": searchRegex },
        { "address.street": searchRegex },
        { "address.district": searchRegex },
      ];
    }

    if (searchParams.get("is24Hours")) {
      query.is24Hours = searchParams.get("is24Hours") === "true";
    }

    // Filter by Service Slug
    const serviceSlug = searchParams.get("service");
    if (serviceSlug) {
      const service = await Service.findOne({ slug: serviceSlug });
      if (service) {
        query.services = service._id;
      }
    }

    // Add geospatial search if lat/lng are provided
    if (!isNaN(lat) && !isNaN(lng)) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistance,
        },
      };
    }

    // Build sort object
    let sortObj = {};
    if (!isNaN(lat) && !isNaN(lng)) {
      // Mongo automatically sorts by distance for $near
      // We can't easily override this with $near unless we use aggregate
      sortObj = {};
    } else if (sort === "rating") {
      sortObj = { isFeatured: -1, "rating.average": -1, "rating.count": -1 };
    } else if (sort === "bookings") {
      sortObj = { isFeatured: -1, completedBookings: -1 };
    } else if (sort === "name") {
      sortObj = { isFeatured: -1, name: 1 };
    } else {
      // Default: Featured first, then newest
      sortObj = { isFeatured: -1, createdAt: -1 };
    }

    // Fetch garages
    const garages = await Garage.find(query)
      .populate("services", "name category")
      .sort(sortObj)
      .limit(limit)
      .lean();

    const total =
      isNaN(lat) || isNaN(lng)
        ? await Garage.countDocuments(query)
        : garages.length;

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
