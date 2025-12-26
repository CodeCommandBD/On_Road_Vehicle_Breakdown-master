import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import FooterLink from "@/lib/db/models/FooterLink";
import { getCurrentUser } from "@/lib/utils/auth";

export async function GET(req) {
  try {
    await connectDB();
    // Public endpoint for fetching links
    const links = await FooterLink.find({ isActive: true }).sort({ order: 1 });
    return NextResponse.json({ success: true, data: links });
  } catch (error) {
    console.error("Error fetching footer links:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
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
    const { label, href, column, order } = body;

    if (!label || !href || !column) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const newLink = await FooterLink.create({
      label,
      href,
      column,
      order: order || 0,
    });

    return NextResponse.json({ success: true, data: newLink }, { status: 201 });
  } catch (error) {
    console.error("Error creating footer link:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
