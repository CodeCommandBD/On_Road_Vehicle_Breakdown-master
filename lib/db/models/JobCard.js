import mongoose from "mongoose";

const JobCardSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true, // One job card per booking
    },
    mechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleDetails: {
      odometer: String,
      fuelLevel: String, // 25%, 50%, etc.
    },
    checklist: [
      {
        category: String, // e.g. "Engine", "Brakes"
        item: String, // e.g. "Oil Level", "Pad Thickness"
        status: {
          type: String,
          enum: ["ok", "issue", "critical", "na"],
          default: "ok",
        },
        note: String,
      },
    ],
    images: [
      {
        url: String,
        caption: String,
      },
    ],
    notes: String,
    customerAcknowledged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.JobCard ||
  mongoose.model("JobCard", JobCardSchema);
