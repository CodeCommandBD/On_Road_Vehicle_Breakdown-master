import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import Garage from "@/lib/db/models/Garage";
import Service from "@/lib/db/models/Service";
import Notification from "@/lib/db/models/Notification";
import { triggerWebhook } from "@/lib/utils/webhook";

// Basic API route for creating bookings
// Authentication details handled via searchParams or logic below

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    // Basic validation could happen here, but Mongoose will also validate.

    // AUTOMATED DISPATCH: If no garage selected, find the nearest one
    if (!body.garage && body.location?.coordinates) {
      const [lng, lat] = body.location.coordinates;
      const nearbyGarages = await Garage.findNearby(lng, lat, 20000); // 20km radius

      if (nearbyGarages && nearbyGarages.length > 0) {
        body.garage = nearbyGarages[0]._id; // Assign the closest one
      } else {
        // Optional: Fail if no garage found, or allow pending without garage (admin assigns later)
        // For now, we will allow it to be created without a garage (pending admin assignment)
      }
    }

    // Create the booking
    const booking = await Booking.create(body);

    // Create notification for garage if assigned
    if (body.garage) {
      try {
        const garage = await Garage.findById(body.garage);
        if (garage && garage.owner) {
          await Notification.create({
            recipient: garage.owner,
            type: "booking_new",
            title: "New Booking Request",
            message: `You have a new booking request for vehicle type: ${body.vehicleType}`,
            link: `/garage/dashboard/bookings/${booking._id}`,
            metadata: { bookingId: booking._id },
          });
        }
      } catch (err) {
        console.error("Failed to create booking notification:", err);
      }
    }

    // --- TRIGGER WEBHOOK (booking.created) ---
    try {
      const webhookPayload = {
        bookingId: booking._id,
        user: body.user,
        garage: body.garage,
        vehicleType: body.vehicleType,
        service: body.service,
        scheduledDate: body.scheduledDate,
        createdAt: booking.createdAt,
      };

      // Notify User
      await triggerWebhook(body.user, "booking.created", webhookPayload);

      // Notify Garage
      if (body.garage) {
        await triggerWebhook(
          null,
          "booking.created",
          webhookPayload,
          body.garage
        );
      }
    } catch (webhookErr) {
      console.error("Booking creation webhook failed:", webhookErr);
    }
    // ----------------------------------------

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

    console.log(`[API] Bookings fetched: ${bookings.length}`);

    return NextResponse.json(
      { success: true, count: bookings.length, bookings },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bookings: " + error.message },
      { status: 500 }
    );
  }
}
