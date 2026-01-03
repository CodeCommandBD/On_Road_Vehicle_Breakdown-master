import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";
import { garageSearchSchema } from "@/lib/validations/garage";
import { handleError, NotFoundError } from "@/lib/utils/errorHandler";
import { successResponse } from "@/lib/utils/apiResponse";
import { BUSINESS, MESSAGES } from "@/lib/utils/constants";

/**
 * GET /api/garages/nearby
 * Find nearby garages using geospatial query
 * Query params: latitude, longitude, radius (optional)
 */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // Map old params (lat/lng) to new params (latitude/longitude) for backward compatibility
    const latitude = searchParams.get("latitude") || searchParams.get("lat");
    const longitude = searchParams.get("longitude") || searchParams.get("lng");

    // Build validation object, only including non-null values
    const validationData = {
      latitude,
      longitude,
    };

    // Only add optional params if they exist
    const radiusParam =
      searchParams.get("radius") || searchParams.get("maxDistance");
    const servicesParam = searchParams.get("services");
    const verifiedParam = searchParams.get("verified");

    if (radiusParam !== null) validationData.radius = radiusParam;
    if (servicesParam !== null) validationData.services = servicesParam;
    if (verifiedParam !== null) validationData.verified = verifiedParam;

    // Validate query parameters using Zod with safeParse for better error messages
    const validationResult = garageSearchSchema.safeParse(validationData);

    if (!validationResult.success) {
      console.error("Validation failed:", {
        errors: validationResult.error.errors,
        received: { latitude, longitude },
      });
      return NextResponse.json(
        {
          success: false,
          message: "Data validation failed.",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const validatedParams = validationResult.data;

    const {
      latitude: lat,
      longitude: lng,
      radius,
      services,
      verified,
    } = validatedParams;

    // Use provided radius or default from constants
    const searchRadius = radius || BUSINESS.SEARCH_RADIUS_METERS;

    // Build geospatial query using $geoWithin with $centerSphere
    // Convert meters to radians for $centerSphere (Earth radius ~6378137m)
    const radiusInRadians = searchRadius / 6378137;

    const query = {
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians],
        },
      },
      isActive: true,
    };

    // Add verified filter if specified
    if (verified !== undefined) {
      query.isVerified = verified;
    }

    // Find nearby garages
    let garagesQuery = Garage.find(query)
      .select(
        "name address location rating images phone isVerified is24Hours operatingHours vehicleTypes services"
      )
      .populate("services", "name description");

    // Filter by services if provided
    if (services) {
      const serviceIds = services.split(",");
      garagesQuery = garagesQuery.where("services").in(serviceIds);
    }

    const limit = parseInt(searchParams.get("limit")) || 20;
    const garages = await garagesQuery.limit(limit);

    // Log search details for debugging
    console.log("Nearby garages search:", {
      coordinates: { latitude: lat, longitude: lng },
      radius: searchRadius,
      radiusInRadians,
      foundCount: garages.length,
      query: JSON.stringify(query),
    });

    // If no garages found, return empty array instead of error
    if (!garages || garages.length === 0) {
      console.warn("No nearby garages found for:", { lat, lng, searchRadius });
      return successResponse(
        {
          garages: [],
          count: 0,
          searchRadius: searchRadius,
          searchLocation: {
            latitude: lat,
            longitude: lng,
          },
        },
        "কোনো গ্যারেজ পাওয়া যায়নি"
      );
    }

    // Haversine distance calculation
    const calculateDistance = (lon1, lat1, lon2, lat2) => {
      const R = 6371e3; // Earth radius in meters
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in meters
    };

    // Add distance to each garage
    const garagesWithDistance = garages.map((garage) => {
      const [garageLng, garageLat] = garage.location.coordinates;
      const distance = calculateDistance(lng, lat, garageLng, garageLat);

      return {
        ...garage.toObject(),
        distance: Math.round(distance), // Distance in meters
        distanceKm: (distance / 1000).toFixed(2), // Distance in km
      };
    });

    // Sort by distance (nearest first)
    garagesWithDistance.sort((a, b) => a.distance - b.distance);

    // Return success response
    return successResponse(
      {
        garages: garagesWithDistance,
        count: garagesWithDistance.length,
        searchRadius: searchRadius,
        searchLocation: {
          latitude: lat,
          longitude: lng,
        },
      },
      `${garagesWithDistance.length}টি গ্যারেজ পাওয়া গেছে`
    );
  } catch (error) {
    return handleError(error);
  }
}
