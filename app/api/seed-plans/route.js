import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Plan from "@/lib/db/models/Plan";

export async function GET() {
  try {
    const mongoose = require("mongoose");
    await connectDB();

    // Drop legacy index if exists
    try {
      await mongoose.connection.collection("plans").dropIndex("tier_1");
      console.log("Legacy tier_1 index dropped");
    } catch (e) {
      // Ignore if index not found
      console.log("tier_1 index not found or already dropped");
    }

    const plans = [
      {
        name: "Garage Basic",
        tier: "free",
        type: "garage",
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
          vehicles: 0,
          responseTime: 60,
        },
        description: "Start growing your business with zero upfront cost.",
        displayOrder: 1,
        isActive: true,
      },
      {
        name: "Garage Pro",
        tier: "premium", // Ensure this tier enum exists in Plan model
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

    // Clear existing garage plans to avoid duplicates
    await Plan.deleteMany({ type: "garage" });

    for (const plan of plans) {
      await Plan.create(plan);
    }

    return NextResponse.json({
      success: true,
      message: "Garage plans seeded successfully",
    });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
