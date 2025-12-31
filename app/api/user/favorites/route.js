import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";

export async function POST(request) {
  // Rate limiting: 30 requests per hour for toggling favorites
  const rateLimitResult = rateLimitMiddleware(request, 30, 60 * 60 * 1000);
  if (rateLimitResult) return rateLimitResult;

  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { garageId } = await request.json();
    if (!garageId) {
      return NextResponse.json(
        { success: false, message: "Garage ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const isFavorite = user.favoriteGarages.includes(garageId);

    if (isFavorite) {
      // Remove from favorites
      user.favoriteGarages = user.favoriteGarages.filter(
        (id) => id.toString() !== garageId
      );
    } else {
      // Add to favorites
      user.favoriteGarages.push(garageId);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: isFavorite ? "Removed from favorites" : "Added to favorites",
      isFavorite: !isFavorite,
      favorites: user.favoriteGarages,
    });
  } catch (error) {
    console.error("Favorite toggle error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  // Rate limiting: 60 requests per minute for fetching favorites
  const rateLimitResult = rateLimitMiddleware(request, 60, 60 * 1000);
  if (rateLimitResult) return rateLimitResult;

  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;

    console.log("🔍 Favorites GET - Token exists:", !!token);

    const decoded = await verifyToken(token);

    if (!decoded) {
      console.log("❌ Favorites GET - Token verification failed");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("✅ Favorites GET - User ID from token:", decoded.userId);

    const user = await User.findById(decoded.userId).populate(
      "favoriteGarages"
    );

    console.log("🔍 Favorites GET - User found:", !!user);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Ensure favoriteGarages is an array
    const favorites = user.favoriteGarages || [];

    return NextResponse.json({
      success: true,
      favorites: favorites,
    });
  } catch (error) {
    console.error("Favorites GET error:", error);
    console.error("Error stack:", error.stack);

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
