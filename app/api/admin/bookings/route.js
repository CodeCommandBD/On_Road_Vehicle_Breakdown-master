import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import { verifyToken } from "@/lib/utils/auth";

async function checkAdmin(request) {
  const token = request.cookies.get("token")?.value;
  const decoded = await verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

export async function GET(request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin)
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );

    await connectDB();
    const bookings = await Booking.find()
      .populate("user", "name email phone")
      .populate("garage", "name address phone")
      .populate("service", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Admin Booking Fetch Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin)
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );

    await connectDB();
    const { bookingId, status, notes } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID required" },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    if (status) {
      booking.status = status;
      if (status === "confirmed") booking.confirmedAt = new Date();
      if (status === "in_progress") booking.startedAt = new Date();
      if (status === "completed") booking.completedAt = new Date();
      if (status === "cancelled") booking.cancelledAt = new Date();
    }

    if (notes) {
      booking.notes.push({
        text: notes,
        createdBy: admin.userId,
      });
    }

    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Booking updated successfully",
      booking,
    });
  } catch (error) {
    console.error("Admin Booking Update Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin)
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );

    await connectDB();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID required" },
        { status: 400 }
      );
    }

    await Booking.findByIdAndDelete(bookingId);

    return NextResponse.json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Admin Booking Delete Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
