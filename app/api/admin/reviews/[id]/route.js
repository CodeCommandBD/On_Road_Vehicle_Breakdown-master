import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Review from "@/lib/db/models/Review";
import { verifyToken } from "@/lib/utils/auth";
import mongoose from "mongoose";

export async function DELETE(request, { params }) {
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

    const { id } = await params;

    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return NextResponse.json(
        { success: false, message: "Review not found" },
        { status: 404 }
      );
    }

    // Trigger post-remove hook manually if needed for updating garage avg?
    // Mongoose 'findByIdAndDelete' triggers query middleware, not doc middleware.
    // Ideally we should findOne, then .remove() or setup a hook for findOneAndDelete.
    // For simplicity now, we'll re-calculate the garage rating manually or trust eventual consistency.
    // Let's do a quick re-calc for the garage to be safe.

    if (review.garage) {
      const Garage = mongoose.model("Garage");
      const stats = await Review.aggregate([
        { $match: { garage: review.garage } },
        {
          $group: {
            _id: "$garage",
            average: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
      ]);

      const updateData =
        stats.length > 0
          ? {
              rating: {
                average: Math.round(stats[0].average * 10) / 10,
                count: stats[0].count,
              },
            }
          : { rating: { average: 0, count: 0 } };

      await Garage.findByIdAndUpdate(review.garage, updateData);
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Admin Delete Review Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete review" },
      { status: 500 }
    );
  }
}
