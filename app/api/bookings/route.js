import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import Garage from "@/lib/db/models/Garage";
import Service from "@/lib/db/models/Service";

// Basic API route for creating bookings
// Authentication details handled via searchParams or logic below

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    // Basic validation could happen here, but Mongoose will also validate.

    // Create the booking
    const booking = await Booking.create(body);

    return NextResponse.json(
      { success: true, message: "Booking created successfully", booking },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking Creation Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    let query = {};

    if (role === "garage") {
      // Find the garage owned by this user
      const garage = await Garage.findOne({ owner: userId });
      if (!garage) {
        return NextResponse.json(
          { success: false, message: "Garage not found for this user" },
          { status: 404 }
        );
      }
      query = { garage: garage._id };
    } else if (role === "admin") {
      // Admin sees everything
      query = {};
    } else {
      // Provide bookings for the regular user
      query = { user: userId };
    }

    const bookings = await Booking.find(query)
      .populate("user", "name email phone")
      .populate("garage", "name address phone")
      .populate("service", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, count: bookings.length, bookings },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
