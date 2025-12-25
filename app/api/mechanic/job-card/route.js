import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import JobCard from "@/lib/db/models/JobCard";
import Booking from "@/lib/db/models/Booking";
import { verifyToken } from "@/lib/utils/auth";

// GET: Fetch Job Card by Booking ID
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID required" },
        { status: 400 }
      );
    }

    const jobCard = await JobCard.findOne({ booking: bookingId });
    return NextResponse.json({ success: true, jobCard });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create or Update Job Card
export async function POST(request) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "mechanic") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId, vehicleDetails, checklist, images, notes } = body;

    // Check if booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Upsert (Update if exists, else Create)
    let jobCard = await JobCard.findOne({ booking: bookingId });

    if (jobCard) {
      // Update
      jobCard.vehicleDetails = vehicleDetails || jobCard.vehicleDetails;
      jobCard.checklist = checklist || jobCard.checklist;
      jobCard.images = images || jobCard.images;
      jobCard.notes = notes || jobCard.notes;
      await jobCard.save();
    } else {
      // Create
      jobCard = await JobCard.create({
        booking: bookingId,
        mechanic: decoded.userId,
        vehicleDetails,
        checklist,
        images,
        notes,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Job Card Saved Successfully",
      jobCard,
    });
  } catch (error) {
    console.error("Job Card API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
