import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Package from "@/lib/db/models/Package";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const tier = searchParams.get("tier");
    const type = searchParams.get("type");
    const isActiveParam = searchParams.get("isActive");

    const query = {};

    // Only filter by isActive if explicitly provided
    if (isActiveParam !== null) {
      query.isActive = isActiveParam === "true";
    }

    if (tier) query.tier = tier;
    if (type) query.type = type;

    const packages = await Package.find(query).sort({ order: 1 }).lean();

    return NextResponse.json({
      success: true,
      data: {
        packages,
        total: packages.length,
      },
    });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch packages",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// CREATE new package
export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();

    // Get the highest order number for the package type
    const lastPackage = await Package.findOne({ type: data.type })
      .sort({ order: -1 })
      .limit(1);

    const newOrder = lastPackage ? lastPackage.order + 1 : 1;

    const newPackage = await Package.create({
      ...data,
      order: newOrder,
    });

    return NextResponse.json(
      {
        success: true,
        data: { package: newPackage },
        message: "Package created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create package",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// UPDATE package
export async function PUT(request) {
  try {
    await dbConnect();
    const data = await request.json();
    const { _id, ...updateData } = data;

    if (!_id) {
      return NextResponse.json(
        { success: false, message: "Package ID is required" },
        { status: 400 }
      );
    }

    const updatedPackage = await Package.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedPackage) {
      return NextResponse.json(
        { success: false, message: "Package not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { package: updatedPackage },
      message: "Package updated successfully",
    });
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update package",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// TOGGLE status/featured (PATCH)
export async function PATCH(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action"); // 'toggle-active' or 'toggle-featured'

    if (!id || !action) {
      return NextResponse.json(
        { success: false, message: "ID and action are required" },
        { status: 400 }
      );
    }

    const pkg = await Package.findById(id);
    if (!pkg) {
      return NextResponse.json(
        { success: false, message: "Package not found" },
        { status: 404 }
      );
    }

    if (action === "toggle-active") {
      pkg.isActive = !pkg.isActive;
    } else if (action === "toggle-featured") {
      pkg.isFeatured = !pkg.isFeatured;
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }

    await pkg.save();

    return NextResponse.json({
      success: true,
      data: { package: pkg },
      message: `Package ${action.replace("toggle-", "")} toggled successfully`,
    });
  } catch (error) {
    console.error("Error toggling package:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to toggle package",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE package
export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Package ID is required" },
        { status: 400 }
      );
    }

    const deletedPackage = await Package.findByIdAndDelete(id);

    if (!deletedPackage) {
      return NextResponse.json(
        { success: false, message: "Package not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Package deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting package:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete package",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
