const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env.local") });

const packageSchema = new mongoose.Schema(
  {
    name: String,
    type: String,
    tier: String,
    description: String,
    price: {
      monthly: Number,
      yearly: Number,
      isCustom: Boolean,
    },
    currency: String,
    benefits: [String],
    features: [{ name: String, included: Boolean, limit: String }],
    discount: Number,
    badge: String,
    prioritySupport: Boolean,
    emergencyResponse: String,
    freeServices: Number,
    discountOnServices: Number,
    isPopular: Boolean,
    isFeatured: Boolean,
    isActive: Boolean,
    order: Number,
    color: String,
    promoEndsAt: Date,
  },
  { strict: false, timestamps: true }
);

const Package =
  mongoose.models.Package || mongoose.model("Package", packageSchema);

async function seedPricingPackages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // USER PACKAGES
    const userPackages = [
      {
        name: "Trial",
        type: "user",
        tier: "trial",
        description: "Try our service free for 7 days",
        price: {
          monthly: 0,
          yearly: 0,
          isCustom: false,
        },
        currency: "BDT",
        benefits: [
          "7-day free trial",
          "1 emergency request",
          "Basic AI mechanic (5 queries)",
          "Standard response time",
          "Email support only",
        ],
        discount: 0,
        prioritySupport: false,
        emergencyResponse: "normal",
        freeServices: 1,
        discountOnServices: 0,
        isPopular: false,
        isFeatured: false,
        isActive: true,
        order: 1,
        color: "#10b981",
      },
      {
        name: "Free",
        type: "user",
        tier: "free",
        description: "Basic breakdown assistance for occasional users",
        price: {
          monthly: 0,
          yearly: 0,
          isCustom: false,
        },
        currency: "BDT",
        benefits: [
          "1 request per month",
          "5km service radius",
          "Basic AI mechanic (10 queries/month)",
          "Standard response (24-48h)",
          "Community support",
        ],
        discount: 0,
        prioritySupport: false,
        emergencyResponse: "normal",
        freeServices: 1,
        discountOnServices: 0,
        isPopular: false,
        isFeatured: false,
        isActive: true,
        order: 2,
        color: "#6b7280",
      },
      {
        name: "Standard",
        type: "user",
        tier: "standard",
        description: "Perfect for regular drivers who want peace of mind",
        price: {
          monthly: 299,
          yearly: 3000, // ~17% discount
          isCustom: false,
        },
        currency: "BDT",
        benefits: [
          "5 requests per month",
          "20km service radius",
          "AI mechanic (50 queries/month)",
          "Priority response (8-12h)",
          "Phone & email support",
          "10% discount on services",
          "Basic analytics",
        ],
        discount: 17,
        prioritySupport: true,
        emergencyResponse: "priority",
        freeServices: 5,
        discountOnServices: 10,
        isPopular: true,
        isFeatured: true,
        isActive: true,
        order: 3,
        color: "#f97316",
      },
      {
        name: "Premium",
        type: "user",
        tier: "premium",
        description: "Comprehensive coverage for frequent travelers",
        price: {
          monthly: 799,
          yearly: 7990, // ~17% discount
          isCustom: false,
        },
        currency: "BDT",
        benefits: [
          "Unlimited requests",
          "Nationwide coverage",
          "Unlimited AI mechanic",
          "Super priority (4-6h)",
          "3 team members",
          "Advanced analytics",
          "15% discount on services",
          "Dedicated support",
        ],
        discount: 17,
        prioritySupport: true,
        emergencyResponse: "immediate",
        freeServices: 999,
        discountOnServices: 15,
        isPopular: false,
        isFeatured: false,
        isActive: true,
        order: 4,
        color: "#a855f7",
      },
      {
        name: "Enterprise",
        type: "user",
        tier: "enterprise",
        description: "Custom solutions for fleet management and businesses",
        price: {
          monthly: 0,
          yearly: 0,
          isCustom: true,
        },
        currency: "BDT",
        benefits: [
          "Unlimited requests & radius",
          "Nationwide coverage",
          "Unlimited AI mechanic",
          "Immediate response (2-4h)",
          "Unlimited team members",
          "Advanced analytics & reports",
          "CRM integrations",
          "Dedicated account manager",
          "Custom SLA",
          "20% discount on services",
        ],
        discount: 0,
        prioritySupport: true,
        emergencyResponse: "immediate",
        freeServices: 999,
        discountOnServices: 20,
        isPopular: false,
        isFeatured: false,
        isActive: true,
        order: 5,
        color: "#eab308",
      },
    ];

    // GARAGE PACKAGES
    const garagePackages = [
      {
        name: "Basic",
        type: "garage",
        tier: "basic",
        description: "Essential tools for small garages to get started",
        price: {
          monthly: 999,
          yearly: 9990, // ~17% discount
          isCustom: false,
        },
        currency: "BDT",
        benefits: [
          "Up to 20 jobs per month",
          "Basic job management",
          "Customer database",
          "Email notifications",
          "Standard listing visibility",
          "Basic analytics",
        ],
        discount: 17,
        prioritySupport: false,
        emergencyResponse: "normal",
        freeServices: 20,
        discountOnServices: 0,
        isPopular: false,
        isFeatured: false,
        isActive: true,
        order: 1,
        color: "#3b82f6",
      },
      {
        name: "Professional",
        type: "garage",
        tier: "professional",
        description: "Complete solution for growing garage businesses",
        price: {
          monthly: 2499,
          yearly: 24990, // ~17% discount
          isCustom: false,
        },
        currency: "BDT",
        benefits: [
          "Unlimited jobs",
          "Advanced job management",
          "Customer CRM",
          "SMS & email notifications",
          "Priority listing (top results)",
          "Advanced analytics & reports",
          "Team management (up to 10 staff)",
          "Inventory tracking",
          "Invoice generation",
          "Priority support",
        ],
        discount: 17,
        prioritySupport: true,
        emergencyResponse: "priority",
        freeServices: 999,
        discountOnServices: 0,
        isPopular: true,
        isFeatured: true,
        isActive: true,
        order: 2,
        color: "#8b5cf6",
      },
    ];

    // Combine all packages
    const allPackages = [...userPackages, ...garagePackages];

    // Seed packages
    let createdCount = 0;
    let updatedCount = 0;

    for (const pkg of allPackages) {
      const existing = await Package.findOne({
        tier: pkg.tier,
        type: pkg.type,
      });

      if (existing) {
        await Package.findOneAndUpdate(
          { tier: pkg.tier, type: pkg.type },
          pkg,
          { new: true }
        );
        console.log(`✅ Updated: ${pkg.name} (${pkg.type})`);
        updatedCount++;
      } else {
        await Package.create(pkg);
        console.log(`✅ Created: ${pkg.name} (${pkg.type})`);
        createdCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Successfully seeded ${allPackages.length} packages`);
    console.log(`   - Created: ${createdCount}`);
    console.log(`   - Updated: ${updatedCount}`);
    console.log(`   - User packages: ${userPackages.length}`);
    console.log(`   - Garage packages: ${garagePackages.length}`);
    console.log("=".repeat(50));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding packages:", error);
    process.exit(1);
  }
}

seedPricingPackages();
