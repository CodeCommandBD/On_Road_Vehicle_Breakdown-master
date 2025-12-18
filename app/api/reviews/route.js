import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Review from "@/lib/db/models/Review";
import Booking from "@/lib/db/models/Booking";
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

    const body = await request.json();
    const { bookingId, rating, comment, images } = body;

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.user.toString() !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    if (booking.status !== "completed") {
      return NextResponse.json(
        {
          success: false,
          message: "Reviews only allowed for completed services",
        },
        { status: 400 }
      );
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          message: "Review already submitted for this booking",
        },
        { status: 400 }
      );
    }

    const review = await Review.create({
      user: decoded.userId,
      garage: booking.garage,
      booking: bookingId,
      rating,
      comment,
      images,
    });

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error("Review POST error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
