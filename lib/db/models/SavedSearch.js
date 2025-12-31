import mongoose from "mongoose";

const savedSearchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String, // e.g., "Nearby Cheap Garages"
      required: true,
      trim: true,
    },
    filters: {
      query: String,
      serviceType: String,
      priceRange: [Number], // [min, max]
      rating: Number,
      location: {
        radius: Number,
        lat: Number,
        lng: Number,
      },
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.SavedSearch ||
  mongoose.model("SavedSearch", savedSearchSchema);
