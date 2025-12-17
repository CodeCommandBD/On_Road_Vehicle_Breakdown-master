import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Plan from "@/lib/db/models/Plan";

// GET single plan by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const plan = await Plan.findById(id);

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { plan },
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch plan",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update plan (Admin only)
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const updates = await request.json();

    const plan = await Plan.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Plan updated successfully",
      data: { plan },
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update plan",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE plan (Admin only)
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const plan = await Plan.findByIdAndDelete(id);

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete plan",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
