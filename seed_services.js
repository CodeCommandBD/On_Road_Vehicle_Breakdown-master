const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

// Define Schema inline to avoid module import issues in standalone script
const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: String,
    category: {
      type: String,
      default: "general",
    },
    basePrice: { type: Number, required: true },
    icon: { type: String, default: "Wrench" },
    image: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Slug middleware
serviceSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

const Service =
  mongoose.models.Service || mongoose.model("Service", serviceSchema);

const services = [
  {
    name: "Windshield Repair",
    basePrice: 1200,
    category: "general", // mapped to existing enum if strictly enforced, but schema says string
    description: "Professional windshield repair and replacement.",
    image: "/images/nav/nav-one.png",
    icon: "Car",
    order: 1,
  },
  {
    name: "Door/Lock Repair",
    basePrice: 800,
    category: "general",
    description: "Car door latch and lock mechanism repair.",
    image: "/images/nav/nav-two.png",
    icon: "Lock",
    order: 2,
  },
  {
    name: "AC Maintenance",
    basePrice: 2500,
    category: "ac",
    description: "Complete air conditioning system check and refill.",
    image: "/images/nav/nav-three.png",
    icon: "Wind",
    order: 3,
  },
  {
    name: "Battery Jumpstart",
    basePrice: 500,
    category: "battery",
    description: "Instant battery jumpstart service.",
    image: "/images/nav/nav-four.png",
    icon: "Battery",
    order: 4,
  },
  {
    name: "Brake Inspection",
    basePrice: 1000,
    category: "brake",
    description: "Brake pad and rotor inspection and replacement.",
    image: "/images/nav/nav-five.png",
    icon: "AlertCircle",
    order: 5,
  },
  {
    name: "Engine Diagnostic",
    basePrice: 1500,
    category: "engine",
    description: "Full engine computer diagnostic scan.",
    image: "/images/nav/nav-six.png",
    icon: "Gauge",
    order: 6,
  },
  {
    name: "Oil Change",
    basePrice: 800,
    category: "general",
    description: "Premium oil change and filter replacement.",
    image: "/images/nav/nav-seven.png",
    icon: "Droplets",
    order: 7,
  },
  {
    name: "Suspension Fix",
    basePrice: 3000,
    category: "general",
    description: "Shock absorber and suspension system repair.",
    image: "/images/nav/nav-eight.png",
    icon: "Wrench",
    order: 8,
  },
  {
    name: "Emergency Towing",
    basePrice: 2000,
    category: "towing",
    description: "24/7 Emergency vehicle towing service.",
    image: "/images/nav/nav-nine.png",
    icon: "Car",
    order: 9,
  },
  {
    name: "Tire Replacement",
    basePrice: 600,
    category: "tire",
    description: "Flat tire change and new tire installation.",
    image: "/images/nav/nav-ten.png",
    icon: "Disc", // No tire icon in lucide set used, fallback or generic
    order: 10,
  },
  {
    name: "Key Lockout Help",
    basePrice: 1000,
    category: "lockout",
    description: "Locked out of your car? We can open it safely.",
    image: "/images/nav/nav-eleven.png",
    icon: "Lock",
    order: 11,
  },
  {
    name: "Car Wash & Detail",
    basePrice: 800,
    category: "general",
    description: "Exterior wash and interior detailing.",
    image: "/images/nav/nav-twelve.png",
    icon: "Droplets",
    order: 12,
  },
];

async function seedServices() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env.local");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing services to avoid duplicates or keep them?
    // User said "add these", implying appending, but duplicates are bad.
    // Let's use updateOne with upsert to be safe.

    for (const service of services) {
      // Create slug for query
      const slug = service.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      await Service.updateOne(
        { slug: slug },
        { $set: { ...service, slug: slug } }, // Ensure slug is set
        { upsert: true }
      );
      console.log(`Processed: ${service.name}`);
    }

    console.log("All services seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedServices();
