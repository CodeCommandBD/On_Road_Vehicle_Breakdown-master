import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const lang = searchParams.get("lang") || "en";

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Latitude and Longitude are required" },
      { status: 400 }
    );
  }

  // Helper to deduplicate and format address parts
  const formatAddress = (parts) => {
    const uniqueParts = new Set(parts.filter(Boolean));
    return Array.from(uniqueParts).join(", ");
  };

  // Strategy 1: Try OpenStreetMap Nominatim (High Detail: supports Tongi, Suburbs, etc.)
  try {
    const nominatimRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          "User-Agent": "QuickServiceWeb/1.0", // Simple custom User-Agent
          "Accept-Language": lang, // Pass language preference (e.g., 'bn', 'en')
        },
      }
    );

    if (nominatimRes.ok) {
      const data = await nominatimRes.json();
      if (data.address) {
        // Nominatim provides detailed address breakdown
        const parts = [
          data.address.amenity, // Building name if applicable
          data.address.road,
          data.address.suburb ||
            data.address.town ||
            data.address.village ||
            data.address.hamlet, // Detailed locality (e.g. Tongi)
          data.address.city_district,
          data.address.city || data.address.municipality || data.address.county,
          data.address.state || data.address.region,
          data.address.country,
        ];
        return NextResponse.json({
          display_name: formatAddress(parts) || data.display_name,
        });
      }
    }
    // If response not OK or no address, fall through to strategy 2
    console.warn("Nominatim failed or empty, falling back...");
  } catch (error) {
    console.warn("Nominatim error, falling back:", error.message);
    // Ignore error and try next provider
  }

  // Strategy 2: BigDataCloud (Reliable Fallback, less detailed)
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`
    );

    if (!bdcRes.ok) {
      throw new Error("Failed to fetch address from BigDataCloud");
    }

    const data = await bdcRes.json();

    const parts = [
      data.locality,
      data.city,
      data.principalSubdivision,
      data.countryName,
    ];

    return NextResponse.json({
      display_name: formatAddress(parts) || "Address not found",
    });
  } catch (error) {
    console.error("Geocoding Internal Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
