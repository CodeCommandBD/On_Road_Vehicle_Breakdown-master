import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    contractNumber: {
      type: String,
      unique: true,
      // Not required here because it's auto-generated in pre-save hook
    },
    terms: {
      type: String,
      required: true,
    },
    customTerms: {
      type: String, // Additional custom clauses
    },
    pricing: {
      amount: { type: Number, required: true },
      currency: { type: String, default: "BDT" },
      billingCycle: {
        type: String,
        enum: ["monthly", "yearly", "custom"],
        default: "yearly",
      },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "pending_signature", "active", "expired", "cancelled"],
      default: "draft",
      index: true,
    },
    signedAt: {
      type: Date,
    },
    signedBy: {
      name: String,
      designation: String,
      signature: String, // Base64 or URL
    },
    pdfUrl: {
      type: String,
    },
    accountManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    metadata: {
      slaMinutes: Number,
      dedicatedSupport: Boolean,
      customFeatures: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate contract number before validation
contractSchema.pre("validate", async function (next) {
  if (!this.contractNumber && this.isNew) {
    try {
      const count = await mongoose.model("Contract").countDocuments();
      const year = new Date().getFullYear();
      this.contractNumber = `CONT-${year}-${String(count + 1).padStart(
        5,
        "0"
      )}`;
    } catch (error) {
      console.error("Error generating contract number:", error);
    }
  }
  next();
});

// Check if expired
contractSchema.methods.isExpired = function () {
  return new Date() > this.endDate;
};

const Contract =
  mongoose.models.Contract || mongoose.model("Contract", contractSchema);

export default Contract;
