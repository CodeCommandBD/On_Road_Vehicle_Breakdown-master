import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import Notification from "@/lib/db/models/Notification";
import { verifyToken } from "@/lib/utils/auth";
import User from "@/lib/db/models/User";

// GET: List Open Jobs for Mechanic
export async function GET(request) {
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

    // Get Mechanic's Garage ID
    const mechanic = await User.findById(decoded.userId);
    if (!mechanic || !mechanic.garageId) {
      return NextResponse.json(
        { success: false, message: "Mechanic not linked to a garage" },
        { status: 400 }
      );
    }

    // Fetch Bookings:
    // 1. Belong to same garage
    // 2. Status is pending or confirmed
    // 3. Not assigned to anyone yet
    const openJobs = await Booking.find({
      garage: mechanic.garageId,
      status: { $in: ["pending", "confirmed"] },
      assignedMechanic: null,
    })
      .populate("user", "name phone location") // Minimum user info needed before accept
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      jobs: openJobs,
    });
  } catch (error) {
    console.error("Open Jobs GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Accept a Job
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

    const { bookingId } = await request.json();

    const booking = await Booking.findById(bookingId).populate(
      "garage",
      "owner"
    );
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.assignedMechanic) {
      return NextResponse.json(
        { success: false, message: "Job already taken by another mechanic" },
        { status: 400 }
      );
    }

    // Assign to Mechanic
    booking.assignedMechanic = decoded.userId;
    booking.status = "confirmed"; // Ensure it's confirmed
    await booking.save();

    // Notify User
    await Notification.create({
      recipient: booking.user,
      type: "booking_update",
      title: "Mechanic Assigned 👨‍🔧",
      message: `Mechanic has accepted your request and is on the way.`,
      link: `/user/dashboard/bookings/${bookingId}`,
    });

    // Notify Garage Owner
    if (booking.garage?.owner) {
      await Notification.create({
        recipient: booking.garage.owner,
        type: "system_alert",
        title: "Job Accepted",
        message: `Booking #${booking.bookingNumber} accepted by mechanic.`,
        link: `/garage/dashboard/bookings/${bookingId}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Job accepted successfully",
      bookingId: booking._id,
    });
  } catch (error) {
    console.error("Job Accept POST error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
