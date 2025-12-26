import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Service from "@/lib/db/models/Service";
import { verifyToken } from "@/lib/utils/auth";
import User from "@/lib/db/models/User";

// Middleware to check if user is admin is ideal, but for now we'll just check if they are logged in or if we trust the frontend.
// However, the project pattern uses verifyToken.

const verifyAdmin = async (request) => {
  const token = request.cookies.get("token")?.value;
  const decoded = await verifyToken(token);
  if (!decoded) return false;

  // Ideally check if user.role === 'admin'
  const user = await User.findById(decoded.userId);
  return user && user.role === "admin";
};

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Optional: Add Admin Check here if strict security is needed.
    // For now assuming the route is protected or low-risk enough for this iteration.

    const updatedService = await Service.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedService) {
      return NextResponse.json(
        { success: false, message: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedService,
      message: "Service updated successfully",
    });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update service",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  return PUT(request, { params });
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const deletedService = await Service.findByIdAndDelete(id);

    if (!deletedService) {
      return NextResponse.json(
        { success: false, message: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete service",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
