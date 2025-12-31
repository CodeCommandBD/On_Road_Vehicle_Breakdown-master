import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import { verifyToken } from "@/lib/utils/auth";
import { verifyOTP } from "@/lib/utils/otp";
import Notification from "@/lib/db/models/Notification";

/**
 * POST /api/bookings/[id]/otp/verify
 * Verify OTP for service start or completion
 */
export async function POST(request, { params }) {
  try {
    await connectDB();

    // Verify authentication
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { type, code } = await request.json(); // 'start' or 'completion', and OTP code

    // Validate input
    if (!["start", "completion"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP type" },
        { status: 400 }
      );
    }

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP code format" },
        { status: 400 }
      );
    }

    // Find booking
    const booking = await Booking.findById(id).populate("user garage");

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Authorization: Only garage owner or assigned mechanic can verify OTP
    const isGarageOwner = booking.garage?.owner?.toString() === decoded.userId;
    const isAssignedMechanic =
      booking.assignedMechanic?.toString() === decoded.userId;

    if (!isGarageOwner && !isAssignedMechanic && decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized to verify OTP" },
        { status: 403 }
      );
    }

    // Get OTP data based on type
    const otpData = type === "start" ? booking.startOTP : booking.completionOTP;

    // Verify OTP
    const verificationResult = verifyOTP(otpData, code);

    if (!verificationResult.success) {
      // Increment attempts if needed
      if (verificationResult.incrementAttempts) {
        if (type === "start") {
          booking.startOTP.attempts += 1;
        } else {
          booking.completionOTP.attempts += 1;
        }
        await booking.save();
      }

      return NextResponse.json(
        {
          success: false,
          message: verificationResult.message,
          attemptsRemaining:
            5 -
            (type === "start"
              ? booking.startOTP.attempts
              : booking.completionOTP.attempts),
        },
        { status: 400 }
      );
    }

    // OTP verified successfully - update booking
    if (type === "start") {
      booking.startOTP.verified = true;
      booking.startOTP.verifiedAt = new Date();
      booking.status = "in_progress";
      booking.startedAt = new Date();
    } else {
      booking.completionOTP.verified = true;
      booking.completionOTP.verifiedAt = new Date();
      booking.status = "completed";
      booking.completedAt = new Date();
    }

    await booking.save();

    // Notify user
    const actionType = type === "start" ? "started" : "completed";
    await Notification.create({
      recipient: booking.user._id,
      type: "booking_update",
      title: `Service ${
        actionType.charAt(0).toUpperCase() + actionType.slice(1)
      }`,
      message: `Your service has been ${actionType} successfully.`,
      link: `/user/dashboard/bookings/${booking._id}`,
      metadata: {
        bookingId: booking._id,
        status: booking.status,
      },
    });

    // If completed, update garage stats
    if (type === "completion") {
      try {
        const Garage = (await import("@/lib/db/models/Garage")).default;
        await Garage.findByIdAndUpdate(booking.garage._id, {
          $inc: { completedBookings: 1 },
        });
      } catch (err) {
        console.error("Failed to update garage stats:", err);
      }
    }

    console.log(
      `✅ OTP Verified for booking ${booking.bookingNumber} (${type})`
    );

    return NextResponse.json(
      {
        success: true,
        message: `Service ${actionType} verified successfully`,
        data: {
          bookingId: booking._id,
          status: booking.status,
          verifiedAt:
            type === "start"
              ? booking.startOTP.verifiedAt
              : booking.completionOTP.verifiedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
