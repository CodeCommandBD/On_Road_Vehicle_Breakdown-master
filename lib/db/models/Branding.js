import mongoose from "mongoose";

const brandingSchema = new mongoose.Schema(
  {
    sectionTitle: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
      default: "Trusted by top automotive partners",
    },
    items: [
      {
        name: {
          type: String,
          required: [true, "Partner name is required"],
          trim: true,
        },
        logoUrl: {
          type: String,
          trim: true,
          default: "",
        },
        icon: {
          type: String,
          required: [true, "Icon name is required"],
          enum: [
            "wrench",
            "users",
            "tag",
            "award",
            "shield",
            "car",
            "tool",
            "star",
          ],
          default: "wrench",
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
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Branding ||
  mongoose.model("Branding", brandingSchema);
