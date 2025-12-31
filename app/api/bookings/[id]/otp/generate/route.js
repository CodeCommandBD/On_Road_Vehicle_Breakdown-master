import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";
import { generateOTPData } from "@/lib/utils/otp";
import Notification from "@/lib/db/models/Notification";

/**
 * POST /api/bookings/[id]/otp/generate
 * Generate OTP for service start or completion
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
    const { type } = await request.json(); // 'start' or 'completion'

    // Validate type
    if (!["start", "completion"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP type" },
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

    // Authorization: Only garage owner or assigned mechanic can generate OTP
    const isGarageOwner = booking.garage?.owner?.toString() === decoded.userId;
    const isAssignedMechanic =
      booking.assignedMechanic?.toString() === decoded.userId;

    if (!isGarageOwner && !isAssignedMechanic && decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized to generate OTP" },
        { status: 403 }
      );
    }

    // Generate OTP (valid for 10 minutes)
    const otpData = generateOTPData(10);

    // Update booking with OTP
    if (type === "start") {
      // Check if service already started
      if (booking.startOTP?.verified) {
        return NextResponse.json(
          {
            success: false,
            message: "Service already started with verified OTP",
          },
          { status: 400 }
        );
      }

      booking.startOTP = otpData;
    } else {
      // completion
      // Check if start OTP was verified
      if (!booking.startOTP?.verified) {
        return NextResponse.json(
          {
            success: false,
            message: "Service must be started first (start OTP not verified)",
          },
          { status: 400 }
        );
      }

      // Check if already completed
      if (booking.completionOTP?.verified) {
        return NextResponse.json(
          {
            success: false,
            message: "Service already completed with verified OTP",
          },
          { status: 400 }
        );
      }

      booking.completionOTP = otpData;
    }

    await booking.save();

    // Send OTP to user via notification
    const otpType = type === "start" ? "Service Start" : "Service Completion";
    await Notification.create({
      recipient: booking.user._id,
      type: "booking_update",
      title: `${otpType} OTP`,
      message: `Your OTP for ${otpType.toLowerCase()} is: ${
        otpData.code
      }. Valid for 10 minutes.`,
      link: `/user/dashboard/bookings/${booking._id}`,
      metadata: {
        bookingId: booking._id,
        otpType: type,
        otp: otpData.code, // In production, consider not storing OTP in notification
      },
    });

    // TODO: Send SMS to user's phone with OTP
    // Example: await sendSMS(booking.user.phone, `Your ${otpType} OTP: ${otpData.code}`);

    console.log(
      `✅ OTP Generated for booking ${booking.bookingNumber}: ${otpData.code} (${type})`
    );

    return NextResponse.json(
      {
        success: true,
        message: `OTP sent to customer successfully`,
        data: {
          expiresAt: otpData.expiresAt,
          // Don't send OTP code to mechanic - only to user
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP generation error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
