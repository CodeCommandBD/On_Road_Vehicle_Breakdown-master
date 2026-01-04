import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Branding from "@/lib/db/models/Branding";
import { getCurrentUser } from "@/lib/utils/auth";

export async function GET(req) {
  try {
    await connectDB();
    // Public endpoint for fetching branding content
    let branding = await Branding.findOne();

    // If no branding exists, create default
    if (!branding) {
      branding = await Branding.create({
        sectionTitle: "Trusted by top automotive partners",
        items: [
          { name: "AutoFix", icon: "wrench", order: 1 },
          { name: "City Towing", icon: "users", order: 2 },
          { name: "Premium Parts", icon: "tag", order: 3 },
          { name: "Verified Mech", icon: "award", order: 4 },
          { name: "Secure Drive", icon: "shield", order: 5 },
        ],
      });
    }

    // Filter active items and sort by order
    const activeItems = branding.items
      .filter((item) => item.isActive)
      .sort((a, b) => a.order - b.order);

    return NextResponse.json({
      success: true,
      data: {
        sectionTitle: branding.sectionTitle,
        items: activeItems,
      },
    });
  } catch (error) {
    console.error("Error fetching branding:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { sectionTitle, items } = body;

    let branding = await Branding.findOne();

    if (!branding) {
      branding = await Branding.create({ sectionTitle, items });
    } else {
      branding.sectionTitle = sectionTitle || branding.sectionTitle;
      branding.items = items || branding.items;
      await branding.save();
    }

    return NextResponse.json({ success: true, data: branding });
  } catch (error) {
    console.error("Error updating branding:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
