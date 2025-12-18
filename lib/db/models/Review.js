import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    garage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garage",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true, // One review per booking
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    images: [String],
  },
  {
    timestamps: true,
  }
);

// Update logic for Garage rating average
reviewSchema.post("save", async function () {
  const Garage = mongoose.model("Garage");
  const stats = await mongoose.model("Review").aggregate([
    { $match: { garage: this.garage } },
    {
      $group: {
        _id: "$garage",
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Garage.findByIdAndUpdate(this.garage, {
      rating: {
        average: Math.round(stats[0].average * 10) / 10,
        count: stats[0].count,
      },
    });
  }
});

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
