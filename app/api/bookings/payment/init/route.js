import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/utils/auth";
import Booking from "@/lib/db/models/Booking";
import Payment from "@/lib/db/models/Payment";
import User from "@/lib/db/models/User";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";
import fs from "fs";
import path from "path";

const logToFile = (message, data = null) => {
  try {
    const logPath = path.join(process.cwd(), "booking-payment-debug.log");
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message} ${
      data ? JSON.stringify(data, null, 2) : ""
    }\n\n`;
    fs.appendFileSync(logPath, logEntry);
  } catch (err) {
    console.error("Failed to write to log file:", err);
  }
};

export async function POST(request) {
  // Rate limiting: 10 payment initiations per hour
  const rateLimitResult = rateLimitMiddleware(request, 10, 60 * 60 * 1000);
  if (rateLimitResult) return rateLimitResult;

  try {
    await connectDB();

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId).populate("user");
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.isPaid) {
      return NextResponse.json(
        { success: false, message: "Booking is already paid" },
        { status: 400 }
      );
    }

    const amount = booking.actualCost || booking.estimatedCost;
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    const transactionId = `TXN-B-${Date.now()}-${booking._id
      .toString()
      .slice(-6)}`;

    // Create payment record
    const payment = await Payment.create({
      userId: currentUser.userId,
      bookingId: booking._id,
      amount,
      currency: "BDT",
      status: "pending",
      paymentMethod: "sslcommerz",
      type: "service_fee",
      sslcommerz: {
        transactionId,
      },
      invoice: {
        billingName: booking.user.name,
        billingEmail: booking.user.email,
        billingPhone: booking.user.phone,
        billingAddress: booking.location?.address || "Dhaka",
      },
      metadata: {
        description: `Service Payment - Booking #${booking.bookingNumber}`,
      },
    });

    // SSLCommerz configuration
    const store_id = process.env.SSLCOMMERZ_STORE_ID;
    const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const is_live = process.env.SSLCOMMERZ_IS_LIVE === "true";

    if (!store_id || !store_passwd) {
      // Fallback for dev/test without credentials
      console.warn(
        "SSLCommerz credentials missing, simulating success for dev."
      );
      // return NextResponse.json ... (Maybe simple success?)
      // No, assume they have credentials or want us to set it up.
      throw new Error("SSLCommerz credentials missing");
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const initData = {
      store_id,
      store_passwd,
      total_amount: amount,
      currency: "BDT",
      tran_id: transactionId,
      success_url: `${baseUrl}/api/bookings/payment/success`,
      fail_url: `${baseUrl}/api/bookings/payment/fail`,
      cancel_url: `${baseUrl}/api/bookings/payment/cancel`,
      ipn_url: `${baseUrl}/api/bookings/payment/ipn`,
      product_name: `Booking Service #${booking.bookingNumber}`,
      product_category: "Service",
      product_profile: "general",
      cus_name: booking.user.name,
      cus_email: booking.user.email,
      cus_add1: booking.location?.address || "Dhaka",
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      cus_phone: booking.user.phone,
      shipping_method: "NO",
      value_a: payment._id.toString(),
      value_b: bookingId,
    };

    const apiUrl = is_live
      ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
      : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

    const formData = new URLSearchParams();
    for (const key in initData) {
      formData.append(key, initData[key]);
    }

    const sslResponse = await fetch(apiUrl, {
      method: "POST",
      body: formData,
    });

    const sslResult = await sslResponse.json();
    logToFile("Booking Payment Init: API Response:", sslResult);

    if (sslResult?.status === "SUCCESS" && sslResult?.GatewayPageURL) {
      await Payment.findByIdAndUpdate(payment._id, {
        "sslcommerz.sessionKey": sslResult.sessionkey || "",
      });

      return NextResponse.json({
        success: true,
        data: {
          paymentUrl: sslResult.GatewayPageURL,
        },
      });
    } else {
      throw new Error(sslResult?.failedreason || "Gateway init failed");
    }
  } catch (error) {
    console.error("Booking Payment Init Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
