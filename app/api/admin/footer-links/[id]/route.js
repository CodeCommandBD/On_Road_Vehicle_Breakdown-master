import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import FooterLink from "@/lib/db/models/FooterLink";
import { getCurrentUser } from "@/lib/utils/auth";

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const updatedLink = await FooterLink.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedLink) {
      return NextResponse.json(
        { success: false, message: "Link not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedLink });
  } catch (error) {
    console.error("Error updating footer link:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const deletedLink = await FooterLink.findByIdAndDelete(id);

    if (!deletedLink) {
      return NextResponse.json(
        { success: false, message: "Link not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Link deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting footer link:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
