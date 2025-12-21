const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { join } = require("path");

// Load environment variables
dotenv.config({ path: join(__dirname, "../../../.env.local") });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

const Plan = require("../../../lib/db/models/Plan").default;

const seedGaragePlans = async () => {
  await connectDB();

  const plans = [
    {
      name: "Garage Basic",
      tier: "free",
      type: "garage", // New field
      price: { monthly: 0, yearly: 0 },
      features: [
        "Basic Garage Listing",
        "Standard Commission (15%)",
        "Receive SOS Alerts",
        "Basic Dashboard Access",
        "Email Support",
      ],
      limits: {
        serviceRadius: 5,
        vehicles: 0, // Not applicable
        responseTime: 60,
      },
      description: "Start growing your business with zero upfront cost.",
      displayOrder: 1,
      isActive: true,
    },
    {
      name: "Garage Pro",
      tier: "premium",
      type: "garage",
      price: { monthly: 1500, yearly: 15000 },
      features: [
        "Verified Badge (Top Trust)",
        "Top Search Ranking",
        "Reduced Commission (10%)",
        "Priority SOS Alerts",
        "Advanced Analytics",
        "24/7 Priority Support",
      ],
      limits: {
        serviceRadius: 20,
        vehicles: 0,
        responseTime: 30,
      },
      highlightFeature: "Most Popular",
      description: "Maximize your earnings and visibility.",
      displayOrder: 2,
      isActive: true,
      isFeatured: true,
    },
  ];

  try {
    console.log("Seeding Garage Plans...");

    // Delete existing garage plans to avoid duplicates during dev
    await Plan.deleteMany({ type: "garage" });

    for (const plan of plans) {
      await Plan.create(plan);
    }

    console.log("Garage Plans Seeded Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding plans:", error);
    process.exit(1);
  }
};

seedGaragePlans();
