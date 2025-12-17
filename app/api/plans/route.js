import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Plan from "@/lib/db/models/Plan";

// GET all active plans
export async function GET(request) {
  try {
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const showInactive = searchParams.get("showInactive") === "true";

    // Build query
    const query = showInactive ? {} : { isActive: true };

    // Fetch plans sorted by display order
    const plans = await Plan.find(query).sort({ displayOrder: 1 });

    return NextResponse.json({
      success: true,
      data: {
        plans,
        count: plans.length,
      },
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch plans",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create new plan (Admin only)
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const { name, tier, price, features, limits } = body;

    if (!name || !tier || !price || !features || !limits) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Create new plan
    const plan = await Plan.create(body);

    return NextResponse.json(
      {
        success: true,
        message: "Plan created successfully",
        data: { plan },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating plan:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan tier already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create plan",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
