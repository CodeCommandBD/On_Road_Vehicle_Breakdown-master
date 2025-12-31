import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Service from "@/lib/db/models/Service";
import { getOrSet } from "@/lib/cache/helpers";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";

export async function GET(request) {
  // Rate limiting: 100 requests per minute for public data
  const rateLimitResult = rateLimitMiddleware(request, 100, 60 * 1000);
  if (rateLimitResult) return rateLimitResult;

  try {
    await dbConnect();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "12");
    const isActive = searchParams.get("isActive") === "true";
    const sort = searchParams.get("sort") || "order";
    const category = searchParams.get("category");

    // Generate cache key based on query params
    const cacheKey = `services:list:${
      category || "all"
    }:${limit}:${sort}:${isActive}`;

    // Use cache with 5-minute TTL
    const result = await getOrSet(
      cacheKey,
      async () => {
        // Build query
        const query = {};
        if (isActive !== undefined) {
          query.isActive = isActive;
        }
        if (category) {
          query.category = category;
        }

        // Build sort object
        let sortObj = {};
        if (sort === "popular") {
          sortObj = { isPopular: -1, order: 1 };
        } else if (sort === "price-asc") {
          sortObj = { basePrice: 1 };
        } else if (sort === "price-desc") {
          sortObj = { basePrice: -1 };
        } else if (sort === "name") {
          sortObj = { name: 1 };
        } else {
          sortObj = { order: 1, name: 1 };
        }

        // Fetch  services
        const services = await Service.find(query)
          .sort(sortObj)
          .limit(limit)
          .lean();

        // Get total count
        const total = await Service.countDocuments(query);

        return {
          services,
          total,
          limit,
        };
      },
      300 // 5 minutes TTL
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch services",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const service = await Service.create(body);

    return NextResponse.json({
      success: true,
      data: service,
      message: "Service created successfully",
    });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create service",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
