import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Coupon from "@/lib/db/models/Coupon";

// GET: Get all coupons
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const isActive = searchParams.get("isActive");

    const skip = (page - 1) * limit;

    let query = {};
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const [coupons, total] = await Promise.all([
      Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        coupons,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get Coupons Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// POST: Create new coupon
export async function POST(request) {
  try {
    await connectDB();

    const data = await request.json();

    // Validate required fields
    const {
      code,
      description,
      discountType,
      discountValue,
      validFrom,
      validUntil,
    } = data;

    if (
      !code ||
      !description ||
      !discountType ||
      !discountValue ||
      !validFrom ||
      !validUntil
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Coupon code already exists" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.create({
      ...data,
      code: code.toUpperCase(),
    });

    return NextResponse.json({
      success: true,
      message: "Coupon created successfully",
      data: { coupon },
    });
  } catch (error) {
    console.error("Create Coupon Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create coupon" },
      { status: 500 }
    );
  }
}

// PATCH: Update coupon
export async function PATCH(request) {
  try {
    await connectDB();

    const { couponId, ...updates } = await request.json();

    if (!couponId) {
      return NextResponse.json(
        { success: false, message: "Coupon ID required" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findByIdAndUpdate(couponId, updates, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Coupon updated successfully",
      data: { coupon },
    });
  } catch (error) {
    console.error("Update Coupon Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

// DELETE: Delete coupon
export async function DELETE(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get("id");

    if (!couponId) {
      return NextResponse.json(
        { success: false, message: "Coupon ID required" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findByIdAndDelete(couponId);

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Delete Coupon Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
