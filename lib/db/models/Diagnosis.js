import mongoose from "mongoose";

const diagnosisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symptoms: {
      type: String,
      required: [true, "Symptoms description is required"],
      trim: true,
      maxlength: [1000, "Symptoms cannot exceed 1000 characters"],
    },
    analysis: {
      possibleCause: {
        type: String,
        required: true,
      },
      estimatedCost: {
        type: String, // String to allow ranges/currency
        required: true,
      },
      immediateAction: {
        type: String,
        required: true,
      },
      severity: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
        default: "Medium",
      },
      preventiveMeasures: [String],
    },
    vehicleType: {
      type: String,
      default: "Car",
    },
    status: {
      type: String,
      enum: ["analyzed", "booked", "resolved"],
      default: "analyzed",
    },
    // Payment tracking for AI Diagnose revenue
    pricePaid: {
      type: Number,
      default: 50, // Default ৳50 per diagnosis
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries in admin/user dashboards
diagnosisSchema.index({ user: 1, createdAt: -1 });

const Diagnosis =
  mongoose.models.Diagnosis || mongoose.model("Diagnosis", diagnosisSchema);

export default Diagnosis;
