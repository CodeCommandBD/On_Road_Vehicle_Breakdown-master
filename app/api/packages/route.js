import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Package from "@/lib/db/models/Package";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const tier = searchParams.get("tier");
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive") !== "false";

    const query = { isActive };
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
