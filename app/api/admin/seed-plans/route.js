import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Plan from "@/lib/db/models/Plan";

export async function GET() {
  try {
    await connectDB();

    const plans = [
      {
        name: "FREE Plan",
        tier: "free",
        price: { monthly: 0, yearly: 0 },
        features: [
          "2 Service Requests / Month",
          "5 km Service Radius",
          "AI Mechanic (3 Diagnoses)",
          "Standard Response Time",
          "Community Support",
          "Basic Dashboard Access",
        ],
        highlightFeature: "Try it out",
        limits: {
          serviceCalls: 2,
          serviceRadius: 5,
          responseTime: 60, // 1 hour
          vehicles: 1,
          aiDiagnosis: 3,
        },
        description: "Perfect for new users to try our service risk-free.",
        isFeatured: false,
        displayOrder: 1,
        isActive: true,
      },
      {
        name: "STANDARD Plan",
        tier: "standard",
        price: { monthly: 1200, yearly: 10800 }, // 1200 * 9 = 25% off approx? adjusted to prompt 10800
        features: [
          "Unlimited Service Requests",
          "20 km Service Radius",
          "Unlimited AI Mechanic",
          "Priority Response (24-48h)",
          "Ad-Free Experience",
          "Email Support",
          "Basic Automation Tools",
          "Save 25% on Yearly Plan",
        ],
        highlightFeature: "MOST POPULAR",
        limits: {
          serviceCalls: -1, // Unlimited
          serviceRadius: 20,
          responseTime: 45,
          vehicles: 1,
          aiDiagnosis: -1,
        },
        description:
          "The best value for individual car owners and freelancers.",
        isFeatured: true, // This makes it the center card
        displayOrder: 2,
        isActive: true,
      },
      {
        name: "PREMIUM Plan",
        tier: "premium",
        price: { monthly: 2500, yearly: 24000 },
        features: [
          "Unlimited Requests & Radius",
          "Nationwide Coverage",
          "Unlimited AI Mechanic",
          "Super Priority (4-6h)",
          "5 Team Members",
          "Advanced Analytics",
          "CRM Integrations",
          "Dedicated Account Manager",
        ],
        highlightFeature: "For Pros",
        limits: {
          serviceCalls: -1,
          serviceRadius: 9999, // Nationwide
          responseTime: 15, // 15 mins for assigning? Prompt said 4-6h response for support, but breakdown is immediate.
          vehicles: 5,
          aiDiagnosis: -1,
        },
        description:
          "For growing businesses and power users who need the best.",
        isFeatured: false,
        displayOrder: 3,
        isActive: true,
      },
      {
        name: "ENTERPRISE Plan",
        tier: "enterprise",
        price: { monthly: 5000, yearly: 50000 }, // Placeholder for "Custom"
        features: [
          "Unlimited Everything",
          "Custom API Access",
          "Unlimited AI Mechanic",
          "Dedicated SLA",
          "White-label Reports",
          "Priority 24/7 Support",
          "Custom Contracts",
        ],
        highlightFeature: "Scale Up",
        limits: {
          serviceCalls: -1,
          serviceRadius: 9999,
          responseTime: 5,
          aiDiagnosis: -1,
        },
        description: "Tailored solutions for large organizations and fleets.",
        isFeatured: false,
        displayOrder: 4,
        isActive: true,
      },
    ];

    // Delete existing to reset
    await Plan.deleteMany({
      tier: {
        $in: ["free", "standard", "premium", "enterprise", "basic", "trial"],
      },
    });

    // Insert new
    await Plan.insertMany(plans);

    return NextResponse.json({
      success: true,
      message: "Plans seeded successfully",
      count: plans.length,
    });
  } catch (error) {
    console.error("Seeding Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
