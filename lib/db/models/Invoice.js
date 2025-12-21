import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        amount: { type: Number, required: true },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      rate: { type: Number, default: 0 }, // Percentage
      amount: { type: Number, default: 0 },
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "BDT",
    },
    status: {
      type: String,
      enum: ["draft", "issued", "paid", "cancelled", "refunded"],
      default: "draft",
      index: true,
    },
    paymentId: {
      type: String, // SSLCommerz transaction ID
    },
    paymentMethod: {
      type: String,
    },
    dueDate: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    pdfUrl: {
      type: String,
    },
    notes: {
      type: String,
    },
    billingAddress: {
      name: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      postalCode: String,
      country: { type: String, default: "Bangladesh" },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate invoice number
invoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model("Invoice").countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(
      5,
      "0"
    )}`;
  }
  next();
});

// Calculate totals
invoiceSchema.methods.calculateTotals = function () {
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  this.tax.amount = (this.subtotal * this.tax.rate) / 100;
  this.total = this.subtotal + this.tax.amount - this.discount;
  return this;
};

const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

export default Invoice;
