/**
 * Seed script to populate membership plans in the database
 * Run with: node lib/db/seedPlans.js
 */

const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const planSchema = new mongoose.Schema(
  {
    name: String,
    tier: { type: String, unique: true },
    price: {
      monthly: Number,
      yearly: Number,
    },
    features: [String],
    limits: {
      serviceCalls: Number,
      responseTime: Number,
      vehicles: Number,
    },
    description: String,
    isActive: Boolean,
    isFeatured: Boolean,
    displayOrder: Number,
  },
  { timestamps: true }
);

const Plan = mongoose.models.Plan || mongoose.model("Plan", planSchema);

const plans = [
  {
    name: "Free Trial",
    tier: "trial",
    price: { monthly: 0, yearly: 0 },
    features: [
      "7-day free trial",
      "1 service call included",
      "Basic features access",
      "Email support",
      "Standard response time (60 mins)",
    ],
    limits: { serviceCalls: 1, responseTime: 60, vehicles: 1 },
    description: "Try our service risk-free for 7 days",
    isActive: true,
    isFeatured: false,
    displayOrder: 0,
  },

  {
    name: "Standard Plan",
    tier: "standard",
    price: { monthly: 349, yearly: 3476 },
    features: [
      "5 service calls per month",
      "Quick response time (30 mins)",
      "Advanced roadside assistance",
      "Phone + Email support",
      "Priority garage booking",
      "Mobile app access",
    ],
    limits: { serviceCalls: 5, responseTime: 30, vehicles: 1 },
    description: "Great for regular drivers with peace of mind",
    isActive: true,
    isFeatured: false,
    displayOrder: 2,
  },
  {
    name: "Premium Plan",
    tier: "premium",
    price: { monthly: 499, yearly: 4969 },
    features: [
      "Unlimited service calls",
      "Emergency response (15 mins)",
      "Latest technology",
      "24/7 service & quick car",
      "Always repairable vehicles",
      "Emergency priority support",
      "Dedicated technician",
      "Mobile app access",
    ],
    limits: { serviceCalls: -1, responseTime: 15, vehicles: 1 },
    description: "Our most popular plan for frequent travelers",
    isActive: true,
    isFeatured: true,
    displayOrder: 3,
  },
  {
    name: "Enterprise Plan",
    tier: "enterprise",
    price: { monthly: 799, yearly: 7955 },
    features: [
      "Everything in Premium",
      "Up to 5 vehicles coverage",
      "Dedicated account manager",
      "Custom SLA agreements",
      "Fleet management dashboard",
      "Priority response (10 mins)",
      "Advanced analytics",
      "24/7 VIP support",
    ],
    limits: { serviceCalls: -1, responseTime: 10, vehicles: 5 },
    description: "Perfect for businesses and fleet management",
    isActive: true,
    isFeatured: false,
    displayOrder: 4,
  },
];

async function seedPlans() {
  try {
    console.log("🌱 Connecting to database...");
    console.log(
      "Using MongoDB URI:",
      process.env.MONGODB_URI ? "Found in .env.local" : "NOT FOUND!"
    );

    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI not found in .env.local");
      console.log("Please make sure .env.local exists with MONGODB_URI");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected successfully!");

    console.log("🗑️  Clearing existing plans...");
    await Plan.deleteMany({});

    console.log("📝 Creating new plans...");
    const createdPlans = await Plan.insertMany(plans);

    console.log("\n✅ Successfully created plans:");
    createdPlans.forEach((plan) => {
      const discount =
        plan.price.monthly > 0
          ? Math.round(
              ((plan.price.monthly * 12 - plan.price.yearly) /
                (plan.price.monthly * 12)) *
                100
            )
          : 0;
      console.log(`\n   ✨ ${plan.name} (${plan.tier})`);
      console.log(`      Monthly: ৳${plan.price.monthly}`);
      console.log(
        `      Yearly: ৳${plan.price.yearly}${
          discount > 0 ? ` (${discount}% off)` : ""
        }`
      );
    });

    console.log("\n🎉 Database seeding completed successfully!\n");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding database:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Check if MongoDB is running (Atlas or local)");
    console.error("2. Verify MONGODB_URI in .env.local is correct");
    console.error("3. Check network connection for MongoDB Atlas\n");
    process.exit(1);
  }
}

seedPlans();
