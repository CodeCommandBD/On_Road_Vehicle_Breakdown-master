const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const packageSchema = new mongoose.Schema(
  {
    name: String,
    tier: { type: String, unique: true },
    price: {
      monthly: Number,
      yearly: Number,
    },
    benefits: [String],
    features: [{ name: String, included: Boolean }],
    isActive: Boolean,
  },
  { strict: false }
);

const Package =
  mongoose.models.Package || mongoose.model("Package", packageSchema);

async function seedPackages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check existing packages
    const existingPackages = await Package.find({});
    console.log(`Found ${existingPackages.length} packages`);

    const premiumData = {
      name: "Premium Membership",
      tier: "premium",
      price: { monthly: 2500, yearly: 25000 },
      currency: "BDT",
      benefits: [
        "Unlimited Requests & Radius",
        "Nationwide Coverage",
        "Unlimited AI Mechanic",
        "Super Priority (4-6h)",
        "5 Team Members",
        "Advanced Analytics",
        "CRM Integrations",
        "Dedicated Account Manager",
      ],
      isActive: true,
    };

    // Upsert Premium Package
    await Package.findOneAndUpdate({ tier: "premium" }, premiumData, {
      upsert: true,
      new: true,
    });
    console.log("Premium Package seeded/updated");

    // Also seed Standard for completeness if missing
    await Package.findOneAndUpdate(
      { tier: "standard" },
      {
        name: "Standard Membership",
        tier: "standard",
        price: { monthly: 299, yearly: 3000 },
        benefits: ["Basic support", "Standard repairs"],
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log("Standard Package seeded/updated");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

seedPackages();
