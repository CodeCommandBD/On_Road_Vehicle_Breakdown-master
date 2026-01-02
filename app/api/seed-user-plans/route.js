import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Package from "@/lib/db/models/Package";

export async function GET() {
  try {
    await connectDB();

    const userPlans = [
      {
        name: "FREE Plan",
        tier: "free",
        type: "user",
        price: { monthly: 0, yearly: 0 },
        features: [
          "4 Service Requests / Month",
          "20 km Service Radius",
          "AI Mechanic (6 Diagnoses)",
          "Standard Response Time",
          "Community Support",
          "Basic Dashboard Access",
          "Community Support",
        ],
        limits: {
          serviceCalls: 4,
          serviceRadius: 20,
          responseTime: 60,
          vehicles: 1,
        },
        description: "Perfect for new users to try our service risk-free.",
        displayOrder: 1,
        isActive: true,
      },
      {
        name: "Trial Plan",
        tier: "trial",
        type: "user",
        price: { monthly: 0, yearly: 0 },
        features: [
          "7-Day Full Access",
          "All Standard Features Included",
          "Priority SOS Alerts",
          "AI Mechanic Access",
        ],
        limits: {
          serviceCalls: -1,
          serviceRadius: 50000,
          responseTime: 15,
          vehicles: 5,
        },
        description: "Experience the full power of On-Road Help for 7 days.",
        displayOrder: 0,
        isActive: true,
      },
      {
        name: "STANDARD Plan",
        tier: "standard",
        type: "user",
        price: { monthly: 1999, yearly: 17991 },
        features: [
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
        limits: {
          serviceCalls: -1,
          serviceRadius: 50,
          responseTime: 30, // 30 mins for SOS, even if 24-48h for bookings
          vehicles: 3,
        },
        highlightFeature: "Most Popular",
        description:
          "The best value for individual car owners and freelancers.",
        displayOrder: 2,
        isActive: true,
        isFeatured: true,
      },
      {
        name: "PREMIUM Plan",
        tier: "premium",
        type: "user",
        price: { monthly: 3999, yearly: 35991 },
        features: [
          "Unlimited Requests & Radius",
          "Nationwide Coverage",
          "Unlimited AI Mechanic",
          "Super Priority (4-6h)",
          "5 Team Members",
          "Advanced Analytics",
          "CRM Integrations",
          "Dedicated Account Manager",
          "Free Fuel Delivery (5L)",
          "Vehicle Re-sell Report",
        ],
        limits: {
          serviceCalls: -1,
          serviceRadius: 50000, // Nationwide
          responseTime: 15,
          vehicles: 10,
        },
        highlightFeature: "Limited Slots",
        description:
          "For growing businesses and power users who need the best.",
        displayOrder: 3,
        isActive: true,
      },
      {
        name: "ENTERPRISE Plan",
        tier: "enterprise",
        type: "user",
        price: { monthly: 0, yearly: 0 },
        features: [
          "Unlimited Everything",
          "Custom API Access",
          "Unlimited AI Mechanic",
          "Dedicated SLA",
          "White-label Reports",
          "Priority 24/7 Support",
          "Custom Contracts",
        ],
        limits: {
          serviceCalls: -1,
          serviceRadius: 50000,
          responseTime: 5,
          vehicles: 99,
        },
        description: "Tailored solutions for large organizations and fleets.",
        displayOrder: 4,
        isActive: true,
      },
    ];

    // Wipe existing user plans to avoid duplicates and ensure freshness
    await Package.deleteMany({ type: "user" });

    // Insert new plans
    for (const planData of userPlans) {
      await Package.create(planData);
    }

    return NextResponse.json({
      success: true,
      message: "User plans (Plan model) seeded successfully",
      count: userPlans.length,
    });
  } catch (error) {
    console.error("User seeder error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
