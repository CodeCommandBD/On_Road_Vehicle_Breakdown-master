import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Service from "@/lib/db/models/Service";

// GET all services
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const category = searchParams.get("category");

    const query = {};
    if (isActive !== null) query.isActive = isActive === "true";
    if (category) query.category = category;

    const services = await Service.find(query).sort({ name: 1 }).lean();

    return NextResponse.json({
      success: true,
      data: {
        services,
        total: services.length,
      },
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch services",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// CREATE new service
export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();

    const newService = await Service.create(data);

    return NextResponse.json(
      {
        success: true,
        data: { service: newService },
        message: "Service created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create service",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// UPDATE service
export async function PUT(request) {
  try {
    await connectDB();
    const data = await request.json();
    const { _id, ...updateData } = data;

    if (!_id) {
      return NextResponse.json(
        { success: false, message: "Service ID is required" },
        { status: 400 }
      );
    }

    const updatedService = await Service.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedService) {
      return NextResponse.json(
        { success: false, message: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { service: updatedService },
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

// TOGGLE active status
export async function PATCH(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Service ID is required" },
        { status: 400 }
      );
    }

    const service = await Service.findById(id);
    if (!service) {
      return NextResponse.json(
        { success: false, message: "Service not found" },
        { status: 404 }
      );
    }

    service.isActive = !service.isActive;
    await service.save();

    return NextResponse.json({
      success: true,
      data: { service },
      message: `Service ${
        service.isActive ? "activated" : "deactivated"
      } successfully`,
    });
  } catch (error) {
    console.error("Error toggling service:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to toggle service",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE service
export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Service ID is required" },
        { status: 400 }
      );
    }

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
