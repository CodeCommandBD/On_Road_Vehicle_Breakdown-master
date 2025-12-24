import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";

// GET: Get all garages with subscription details
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const tier = searchParams.get("tier");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    let query = {};

    if (tier && tier !== "all") {
      query.membershipTier = tier;
    }

    const search = searchParams.get("search");
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { garageName: { $regex: search, $options: "i" } },
      ];
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (status === "active") {
      query.membershipExpiry = { $gt: now };
      query.membershipTier = { $nin: ["free", null] };
    } else if (status === "expired") {
      query.membershipExpiry = { $lt: now };
      query.membershipTier = { $nin: ["free", null] };
    } else if (status === "expiring") {
      query.membershipExpiry = { $gt: now, $lt: sevenDaysFromNow };
    }

    const [garages, total] = await Promise.all([
      Garage.find(query)
        .select(
          "name email phone membershipTier membershipExpiry createdAt isVerified"
        )
        .sort({ membershipExpiry: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Garage.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        garages,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get Garages Subscription Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch garages" },
      { status: 500 }
    );
  }
}

// PATCH: Update garage subscription
export async function PATCH(request) {
  try {
    await connectDB();

    const { garageId, membershipTier, membershipExpiry, action } =
      await request.json();

    if (!garageId) {
      return NextResponse.json(
        { success: false, message: "Garage ID required" },
        { status: 400 }
      );
    }

    const garage = await Garage.findById(garageId);
    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    if (action === "upgrade" || action === "downgrade") {
      if (!membershipTier) {
        return NextResponse.json(
          { success: false, message: "Membership tier required" },
          { status: 400 }
        );
      }
      garage.membershipTier = membershipTier;
    }

    if (action === "extend" || action === "upgrade" || action === "downgrade") {
      if (!membershipExpiry) {
        return NextResponse.json(
          { success: false, message: "Expiry date required" },
          { status: 400 }
        );
      }
      garage.membershipExpiry = new Date(membershipExpiry);
    }

    if (action === "activate") {
      if (!membershipTier || !membershipExpiry) {
        return NextResponse.json(
          { success: false, message: "Tier and expiry required" },
          { status: 400 }
        );
      }
      garage.membershipTier = membershipTier;
      garage.membershipExpiry = new Date(membershipExpiry);
    }

    if (action === "deactivate") {
      garage.membershipTier = "free";
      garage.membershipExpiry = new Date();
    }

    await garage.save();

    return NextResponse.json({
      success: true,
      message: `Garage subscription ${action}d successfully`,
      data: { garage },
    });
  } catch (error) {
    console.error("Update Garage Subscription Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
