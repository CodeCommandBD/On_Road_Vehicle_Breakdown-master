import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Package from "@/lib/db/models/Package";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const pkg = await Package.findById(id).lean();

    if (!pkg) {
      return NextResponse.json(
        { success: false, message: "Package not found" },
        { status: 404 }
      );
    }

    // Transform Package to match Plan structure expected by frontend
    // The Checkout page expects: success, data: { plan: { ... } }
    // It also expects fields like features array
    const transformedPlan = {
      ...pkg,
      features: pkg.features.map((f) => f.name || f), // Handle if features is array of objects or strings
    };

    return NextResponse.json({
      success: true,
      data: {
        plan: transformedPlan,
      },
    });
  } catch (error) {
    console.error("Error fetching package:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch package details",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
