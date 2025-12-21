import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Package from "@/lib/db/models/Package";

export async function GET() {
  try {
    await dbConnect();

    // Data to seed
    const userPackages = [
      {
        name: "FREE Plan",
        type: "user",
        tier: "free",
        price: { monthly: 0, yearly: 0 },
        description: "Perfect for new users to try our service risk-free.",
        benefits: [
          "2 Service Requests / Month",
          "5 km Service Radius",
          "AI Mechanic (3 Diagnoses)",
          "Standard Response Time",
          "Community Support",
          "Basic Dashboard Access",
        ],
        order: 1,
        color: "#4B5563",
      },
      {
        name: "STANDARD Plan",
        type: "user",
        tier: "standard",
        price: { monthly: 1200, yearly: 10800 },
        description:
          "The best value for individual car owners and freelancers.",
        benefits: [
          "Unlimited Service Requests",
          "20 km Service Radius",
          "Unlimited AI Mechanic",
          "Priority Response (24-48h)",
          "Ad-Free Experience",
          "Email Support",
          "Basic Automation Tools",
          "Save 25% on Yearly Plan",
        ],
        badge: "MOST POPULAR",
        isPopular: true,
        order: 2,
        color: "#22C55E",
      },
      {
        name: "PREMIUM Plan",
        type: "user",
        tier: "premium",
        price: { monthly: 2500, yearly: 25000 },
        description:
          "For growing businesses and power users who need the best.",
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
        badge: "LIMITED SLOTS",
        order: 3,
        color: "#F97316",
      },
      {
        name: "ENTERPRISE Plan",
        type: "user",
        tier: "enterprise",
        price: { monthly: 0, yearly: 0, isCustom: true },
        description: "Tailored solutions for large organizations and fleets.",
        benefits: [
          "Unlimited Everything",
          "Custom API Access",
          "Unlimited AI Mechanic",
          "Dedicated SLA",
          "White-label Reports",
          "Priority 24/7 Support",
          "Custom Contracts",
        ],
        order: 4,
        color: "#A855F7",
      },
    ];

    const garagePackages = [
      {
        name: "Garage Basic",
        type: "garage",
        tier: "garage_basic",
        price: { monthly: 0, yearly: 0 },
        description: "Start growing your business with zero upfront cost.",
        benefits: [
          "Basic Garage Listing",
          "Standard Commission (15%)",
          "Receive SOS Alerts",
          "Basic Dashboard Access",
          "Email Support",
        ],
        order: 1,
        color: "#4B5563",
      },
      {
        name: "Garage Pro",
        type: "garage",
        tier: "garage_pro",
        price: { monthly: 1500, yearly: 15000 },
        description: "Maximize your earnings and visibility.",
        benefits: [
          "Verified Badge (Top Trust)",
          "Top Search Ranking",
          "Reduced Commission (10%)",
          "Priority SOS Alerts",
          "Advanced Analytics",
          "24/7 Priority Support",
        ],
        badge: "LIMITED SLOTS",
        order: 2,
        isPopular: true,
        color: "#F97316",
      },
    ];

    // Wipe and Reseed
    await Package.deleteMany({});

    // Insert User Packages
    for (const pkg of userPackages) {
      await Package.create(pkg);
    }

    // Insert Garage Packages
    for (const pkg of garagePackages) {
      await Package.create(pkg);
    }

    return NextResponse.json({
      success: true,
      message: "Packages seeded successfully!",
      data: { user: userPackages.length, garage: garagePackages.length },
    });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
