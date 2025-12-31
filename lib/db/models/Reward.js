import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Reward title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Reward description is required"],
    },
    pointsCost: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String, // Optional URL for reward image
    },
    type: {
      type: String,
      enum: ["service_discount", "subscription_upgrade", "gift_card", "other"],
      default: "service_discount",
    },
    value: {
      type: Number, // e.g. amount of discount, or duration of upgrade in days
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
    },
    stock: {
      type: Number, // -1 for unlimited
      default: -1,
    },
  },
  {
    timestamps: true,
  }
);

const Reward = mongoose.models.Reward || mongoose.model("Reward", rewardSchema);

export default Reward;
