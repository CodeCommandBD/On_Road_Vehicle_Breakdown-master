import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";

export async function POST(request) {
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

    const user = await User.findById(decoded.userId).populate(
      "favoriteGarages"
    );

    return NextResponse.json({
      success: true,
      favorites: user.favoriteGarages,
    });
  } catch (error) {
    console.error("Favorites GET error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
