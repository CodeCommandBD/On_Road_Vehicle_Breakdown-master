import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Package from "@/lib/db/models/Package";

export async function GET() {
  try {
    await dbConnect();

    // Data to seed
    const userPackages = [
      {
        name: "7-Day Trial",
        type: "user",
        tier: "trial",
        price: { monthly: 0, yearly: 0 },
        description:
          "Experience full premium access for 7 days. Card required.",
        benefits: [
          "7-Day Full Premium Access",
          "All Premium Features Active",
          "Unlimited AI Diagnoses",
          "Priority SOS Alerts",
          "Cancel Anytime",
        ],
        badge: "FREE TRIAL",
        order: 0,
        color: "#3B82F6",
      },
      {
        name: "FREE Plan",
        type: "user",
        tier: "free",
        price: { monthly: 0, yearly: 0 },
        description: "Perfect for new users to try our service risk-free.",
        benefits: [
          "4 Service Requests / Month",
          "20 km Service Radius",
          "AI Mechanic (6 Diagnoses)",
          "Standard Response Time",
          "Community Support",
          "Basic Dashboard Access",
          "Community Support",
        ],
        order: 1,
        color: "#4B5563",
      },
      {
        name: "STANDARD Plan",
        type: "user",
        tier: "standard",
        price: { monthly: 1999, yearly: 17991 },
        discount: 25,
        description:
          "The best value for individual car owners and freelancers.",
        benefits: [
          "Unlimited Service Requests",
          "50 km Service Radius",
          "AI Mechanic (500 Diagnoses)",
          "Priority Response (24-48h)",
          "Ad-Free Experience",
          "Email Support",
          "Basic Automation Tools",
          "Priority Booking",
          "Battery Jump-start",
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
        price: { monthly: 3999, yearly: 35991 },
        discount: 25,
        description:
          "For growing businesses and power users who need the best.",
        benefits: [
          "Unlimited Requests & Radius",
          "Unlimited AI Mechanic",
          "Super Priority (4-6h)",
          "5 Team Members",
          "Advanced Analytics",
          "CRM Integrations",
          "Dedicated Account Manager",
          "Free Fuel Delivery (5L)",
          "Nationwide Coverage",
          "Re-sell Report",
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
          "Basic Dashboard Access",
          "SOS Alerts & GPS",
          "15% Standard Commission",
        ],
        order: 1,
        color: "#4B5563",
      },
      {
        name: "Garage Pro",
        type: "garage",
        tier: "garage_pro",
        price: { monthly: 2499, yearly: 23990 },
        discount: 20,
        description: "Maximize your earnings and visibility.",
        benefits: [
          "Verified Badge (Top Trust)",
          "Top Search Ranking",
          "24/7 Priority Support",
          "10% Reduced Commission",
          "Direct Customer Chat",
          "Workshop Gallery Showcase",
          "SMS Notifications",
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
