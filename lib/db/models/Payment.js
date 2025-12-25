import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: false,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    type: {
      type: String,
      enum: ["subscription", "service_fee", "payout", "refund", "adjustment"],
      required: [true, "Payment type is required"],
      default: "subscription",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
    },
    currency: {
      type: String,
      default: "BDT",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["sslcommerz", "manual", "cash", "bank", "bkash", "nagad"], // Expanded enums
      required: [true, "Payment method is required"],
    },
    // Manual / General Transaction ID
    transactionId: {
      type: String,
      sparse: true,
      trim: true,
    },
    // SSLCommerz specific fields
    sslcommerz: {
      transactionId: {
        type: String,
        sparse: true,
      },
      sessionKey: {
        type: String,
        default: null,
      },
      bankTransactionId: {
        type: String,
        default: null,
      },
      cardType: {
        type: String,
        default: null,
      },
      cardBrand: {
        type: String,
        default: null,
      },
      validatedOn: {
        type: Date,
        default: null,
      },
    },
    // Invoice details
    invoice: {
      invoiceNumber: {
        type: String,
        unique: true,
        sparse: true,
      },
      billingName: String,
      billingEmail: String,
      billingPhone: String,
      billingAddress: String,
    },
    // Payment metadata
    metadata: {
      ipAddress: String,
      userAgent: String,
      description: String,
    },
    // Refund details (if applicable)
    refund: {
      amount: {
        type: Number,
        default: 0,
      },
      reason: String,
      processedAt: Date,
      transactionId: String,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Generate invoice number
paymentSchema.pre("save", async function (next) {
  if (this.isNew && this.status === "success" && !this.invoice.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const count = await mongoose.model("Payment").countDocuments();
    this.invoice.invoiceNumber = `INV-${year}${month}-${String(
      count + 1
    ).padStart(5, "0")}`;
  }
  next();
});

// Indexes
paymentSchema.index({ userId: 1, status: 1 });
// sslcommerz.transactionId already has sparse: true, which creates an index
paymentSchema.index({ createdAt: -1 });
// invoice.invoiceNumber already has unique: true and sparse: true, which creates an index

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default Payment;
