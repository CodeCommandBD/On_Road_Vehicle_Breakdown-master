import mongoose from "mongoose";

const sosSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: String,
    },
    vehicleType: {
      type: String,
      enum: ["car", "motorcycle", "bus", "truck", "cng", "rickshaw", "other"],
      required: false,
    },
    phone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "resolved", "cancelled"],
      default: "pending",
    },
    assignedGarage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garage",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

sosSchema.index({ location: "2dsphere" });
sosSchema.index({ status: 1 });

const SOS = mongoose.models.SOS || mongoose.model("SOS", sosSchema);

export default SOS;
