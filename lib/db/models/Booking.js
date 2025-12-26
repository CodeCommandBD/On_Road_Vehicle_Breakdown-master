import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    garage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garage",
      required: false, // Changed to false to allow admin assignment later
    },
    assignedMechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    bookingNumber: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "on_the_way",
        "diagnosing",
        "estimate_sent",
        "in_progress",
        "payment_pending",
        "completed",
        "cancelled",
        "disputed",
      ],
      default: "pending",
    },
    towingRequested: {
      type: Boolean,
      default: false,
    },
    towingCost: {
      type: Number,
      default: 0,
    },
    vehicleType: {
      type: String,
      enum: ["car", "motorcycle", "bus", "truck", "cng", "rickshaw", "other"],
      required: true,
    },
    vehicleInfo: {
      brand: String,
      model: String,
      year: Number,
      plateNumber: String,
      color: String,
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
    // Real-time driver location
    driverLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    images: [
      {
        url: String,
        description: String,
      },
    ],
    estimatedCost: {
      type: Number,
      default: 0,
    },
    actualCost: {
      type: Number,
      default: null,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bkash", "nagad", "card", "online"],
      default: "cash",
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: String,
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      createdAt: Date,
    },
    notes: [
      {
        text: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    billItems: [
      {
        description: String,
        amount: Number,
        category: {
          type: String,
          enum: ["part", "labor", "discount", "other"],
          default: "part",
        },
      },
    ],
    dispute: {
      reason: String,
      adminNotes: String,
      status: {
        type: String,
        enum: ["none", "pending", "resolved", "dismissed"],
        default: "none",
      },
      resolutionType: {
        type: String,
        enum: ["refund", "adjustment", "none"],
        default: "none",
      },
      resolvedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate booking number before saving
bookingSchema.pre("save", async function (next) {
  if (!this.bookingNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.bookingNumber = `QS${year}${month}${day}${random}`;
  }
  next();
});

// Indexes
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ garage: 1, status: 1 });
// bookingNumber already has unique: true, which creates an index
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ location: "2dsphere" });

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default Booking;
