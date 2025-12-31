import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";
import Service from "@/lib/db/models/Service";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";

export async function GET(request) {
  // Rate limiting: 100 requests per minute for public data
  const rateLimitResult = rateLimitMiddleware(request, 100, 60 * 1000);
  if (rateLimitResult) return rateLimitResult;

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

    // Fetch garages (fetch more to allow for re-ranking)
    const fetchLimit = limit * 3;
    let garages = await Garage.find(query)
      .populate("services", "name category")
      .sort(sortObj)
      .limit(fetchLimit)
      .lean();

    // Custom Ranking Logic: Boost Premium & Verified
    if (!isNaN(lat) && !isNaN(lng)) {
      garages.sort((a, b) => {
        // Scoring system: Higher score = better rank
        const getScore = (g) => {
          let score = 0;
          const isPremium =
            (g.membershipTier === "premium" ||
              g.membershipTier === "enterprise" ||
              g.membershipTier === "garage_pro") &&
            (!g.membershipExpiry || new Date(g.membershipExpiry) > new Date());
          if (isPremium) score += 20; // Premium boost
          if (g.isVerified) score += 10; // Verified boost
          return score;
        };

        const scoreA = getScore(a);
        const scoreB = getScore(b);

        if (scoreA !== scoreB) {
          return scoreB - scoreA; // Higher score first
        }
        return 0; // Maintain distance order if scores match
      });

      // Slice to original limit
      garages = garages.slice(0, limit);
    }

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
