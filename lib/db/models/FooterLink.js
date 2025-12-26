import mongoose from "mongoose";

const footerLinkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, "Label is required"],
      trim: true,
    },
    href: {
      type: String,
      required: [true, "URL path is required"],
      trim: true,
    },
    column: {
      type: String,
      required: [true, "Column category is required"],
      enum: ["company", "services", "discover", "help"],
      default: "company",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.FooterLink ||
  mongoose.model("FooterLink", footerLinkSchema);
