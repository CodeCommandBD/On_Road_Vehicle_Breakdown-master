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
    const maxDistance = parseInt(searchParams.get("maxDistance")) || 50000; // 50km default

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, message: "Latitude and Longitude are required" },
        { status: 400 }
      );
    }

    const totalCount = await Garage.countDocuments();
    const allGarages = await Garage.find(
      {},
      "name location isActive isVerified"
    );

    // Convert meters to radians for $centerSphere (Earth radius ~6378137m)
    const radiusInRadians = maxDistance / 6378137;

    console.log(`Nearby Search Debug:
      Request Params: lng=${lng}, lat=${lat}, maxDist=${maxDistance}
      Total Garages in DB: ${totalCount}
    `);

    // Using $geoWithin with $centerSphere as it's often more reliable
    const garages = await Garage.find({
      location: {
        $geoWithin: {
          $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians],
        },
      },
      isActive: true,
    })
      .limit(limit)
      .select("name address location rating images phone isVerified is24Hours");

    // Haversine distance calculation for debugging
    const calculateDistance = (lon1, lat1, lon2, lat2) => {
      const R = 6371; // km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return (R * c).toFixed(2);
    };

    return NextResponse.json(
      {
        success: true,
        count: garages.length,
        totalDBCount: totalCount,
        debug_search: {
          lng,
          lat,
          maxDistance,
          radiusInRadians,
        },
        debug_all_garages: allGarages.map((g) => ({
          name: g.name,
          loc: g.location.coordinates,
          distance_km: calculateDistance(
            lng,
            lat,
            g.location.coordinates[0],
            g.location.coordinates[1]
          ),
          active: g.isActive,
          verified: g.isVerified,
        })),
        garages,
      },
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
