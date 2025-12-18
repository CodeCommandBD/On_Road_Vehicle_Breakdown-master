import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import Garage from "@/lib/db/models/Garage";
import { verifyToken } from "@/lib/utils/auth";

// PATCH /api/bookings/[id]/status - Update booking status
export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = [
      "pending",
      "accepted",
      "in-progress",
      "completed",
      "canceled",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    // Find booking and populate garage
    const booking = await Booking.findById(id).populate("garage");
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Authorization check: Only garage owner can update booking status
    if (booking.garage.owner.toString() !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to update this booking" },
        { status: 403 }
      );
    }

    // Update booking status
    booking.status = status;
    await booking.save();

    // If booking is completed, increment garage completedBookings count
    if (status === "completed") {
      await Garage.findByIdAndUpdate(booking.garage._id, {
        $inc: { completedBookings: 1 },
      });
    }

    // Return updated booking
    const updatedBooking = await Booking.findById(id)
      .populate("user", "name email phone")
      .populate("garage", "name address phone")
      .populate("service", "name");

    return NextResponse.json(
      {
        success: true,
        message: `Booking ${status} successfully`,
        booking: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Booking status update error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
