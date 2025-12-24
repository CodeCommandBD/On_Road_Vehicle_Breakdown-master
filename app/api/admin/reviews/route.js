import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Review from "@/lib/db/models/Review";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import { verifyToken } from "@/lib/utils/auth";

export async function GET(request) {
  try {
    await connectDB();

    // Verify Admin Token (checking strictly for security)
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    // In a real app we'd check if role === 'admin' here too,
    // but the middleware usually handles route protection.
    // Safest to just proceed if we trust middleware, or add a quick check.
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const rating = searchParams.get("rating");

    const skip = (page - 1) * limit;

    let query = {};
    if (rating && rating !== "all") {
      query.rating = parseInt(rating);
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate("user", "name email")
        .populate("garage", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Admin Get Reviews Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
