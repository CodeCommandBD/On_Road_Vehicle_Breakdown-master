import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: [true, "Plan ID is required"],
    },
    status: {
      type: String,
      enum: ["trial", "active", "cancelled", "expired", "pending"],
      default: "pending",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      required: [true, "Billing cycle is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    paymentMethod: {
      type: String,
      enum: ["sslcommerz", "manual"],
      default: "sslcommerz",
    },
    transactionId: {
      type: String,
      sparse: true,
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
    // Usage tracking
    usage: {
      serviceCallsUsed: {
        type: Number,
        default: 0,
      },
      lastServiceCallDate: {
        type: Date,
        default: null,
      },
    },
    // Invoices for this subscription
    invoices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
      },
    ],
    // Contract (for Enterprise plans)
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
    },
    // Trial tracking
    isTrialUsed: {
      type: Boolean,
      default: false,
    },
    // Cancellation details
    cancellationDate: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for checking if subscription is active
subscriptionSchema.virtual("isActive").get(function () {
  return (
    this.status === "active" &&
    new Date() >= this.startDate &&
    new Date() <= this.endDate
  );
});

// Virtual for days remaining
subscriptionSchema.virtual("daysRemaining").get(function () {
  if (this.status !== "active" && this.status !== "trial") return 0;
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Method to check if user can make a service call
subscriptionSchema.methods.canMakeServiceCall = async function () {
  // Get the plan details
  const Plan = mongoose.model("Plan");
  const plan = await Plan.findById(this.planId);

  if (!plan) return false;

  // Check if subscription is active
  if (!this.isActive) return false;

  // Check service call limit
  if (plan.limits.serviceCalls === -1) return true; // Unlimited
  if (this.usage.serviceCallsUsed < plan.limits.serviceCalls) return true;

  return false;
};

// Method to increment service call usage
subscriptionSchema.methods.incrementServiceCall = async function () {
  this.usage.serviceCallsUsed += 1;
  this.usage.lastServiceCallDate = new Date();
  return await this.save();
};

// Indexes
// userId and status already have index: true, creating individual indexes
// Combined index for queries filtering by both userId and status
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });
// transactionId: sparse property already creates an index

const Subscription =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
