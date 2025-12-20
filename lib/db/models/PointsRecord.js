import mongoose from "mongoose";

const pointsRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["earn", "redeem"],
      default: "earn",
    },
    reason: {
      type: String,
      required: true,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookup of a user's points history
pointsRecordSchema.index({ user: 1, createdAt: -1 });

const PointsRecord =
  mongoose.models.PointsRecord ||
  mongoose.model("PointsRecord", pointsRecordSchema);

export default PointsRecord;
