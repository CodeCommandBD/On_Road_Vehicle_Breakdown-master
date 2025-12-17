import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/utils/auth";
import Plan from "@/lib/db/models/Plan";
import User from "@/lib/db/models/User";
import Payment from "@/lib/db/models/Payment";
import Subscription from "@/lib/db/models/Subscription";
import fs from "fs";
import path from "path";

const logToFile = (message, data = null) => {
  try {
    const logPath = path.join(process.cwd(), "payment-debug.log");
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
  try {
    await connectDB();

    // Get authenticated user
    console.log("Payment Init: Checking authentication...");
    const currentUser = await getCurrentUser();
    console.log("Payment Init: currentUser =", currentUser);

    if (!currentUser || !currentUser.userId) {
      console.error("Payment Init: Authentication failed - no user or userId");
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please login again" },
        { status: 401 }
      );
    }

    console.log(
      "Payment Init: User authenticated, userId =",
      currentUser.userId
    );

    // Get user from database
    const user = await User.findById(currentUser.userId);
    console.log("Payment Init: User found in DB:", user?.email);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const { planId, billingCycle, billingInfo } = await request.json();

    // Validate inputs
    if (!planId || !billingCycle || !billingInfo) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get plan details
    const plan = await Plan.findById(planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, message: "Plan not found" },
        { status: 404 }
      );
    }

    // Calculate amount
    const amount =
      billingCycle === "monthly" ? plan.price.monthly : plan.price.yearly;

    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${user._id.toString().slice(-6)}`;

    // Create pending subscription
    const subscription = await Subscription.create({
      userId: user._id,
      planId: plan._id,
      status: "pending",
      billingCycle,
      startDate: new Date(),
      endDate: new Date(
        Date.now() +
          (billingCycle === "monthly" ? 30 : 365) * 24 * 60 * 60 * 1000
      ),
      amount,
      currency: "BDT",
    });

    // Create payment record
    const payment = await Payment.create({
      subscriptionId: subscription._id,
      userId: user._id,
      amount,
      currency: "BDT",
      status: "pending",
      paymentMethod: "sslcommerz",
      sslcommerz: {
        transactionId,
      },
      invoice: {
        billingName: billingInfo.name,
        billingEmail: billingInfo.email,
        billingPhone: billingInfo.phone,
        billingAddress: billingInfo.address || "",
      },
      metadata: {
        description: `${plan.name} - ${billingCycle} subscription`,
      },
    });

    // SSLCommerz configuration
    const store_id = process.env.SSLCOMMERZ_STORE_ID;
    const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const is_live = process.env.SSLCOMMERZ_IS_LIVE === "true";

    logToFile("Payment Init: Config:", {
      store_id_exists: !!store_id,
      store_passwd_exists: !!store_passwd,
      is_live,
    });

    if (!store_id || !store_passwd) {
      throw new Error("SSLCommerz credentials missing");
    }

    // App base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Prepare data for SSLCommerz
    const initData = {
      store_id,
      store_passwd,
      total_amount: amount,
      currency: "BDT",
      tran_id: transactionId,
      success_url: `${baseUrl}/api/payments/success`,
      fail_url: `${baseUrl}/api/payments/fail`,
      cancel_url: `${baseUrl}/api/payments/cancel`,
      ipn_url: `${baseUrl}/api/payments/ipn`,
      product_name: plan.name,
      product_category: "Subscription",
      product_profile: "general",
      cus_name: billingInfo.name,
      cus_email: billingInfo.email,
      cus_add1: billingInfo.address || "Dhaka",
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      cus_phone: billingInfo.phone,
      shipping_method: "NO",
      value_a: payment._id.toString(), // Store payment ID for reference
      value_b: subscription._id.toString(), // Store subscription ID
      value_c: billingCycle,
    };

    logToFile("Payment Init: Initializing with data:", {
      ...initData,
      store_passwd: "***",
    });

    // Determine API URL
    const apiUrl = is_live
      ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
      : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

    // Use URLSearchParams for form-urlencoded body
    const formData = new URLSearchParams();
    for (const key in initData) {
      formData.append(key, initData[key]);
    }

    // Direct fetch call
    const sslResponse = await fetch(apiUrl, {
      method: "POST",
      body: formData,
    });

    const sslResult = await sslResponse.json();
    logToFile("Payment Init: API Response:", sslResult);

    if (sslResult?.status === "SUCCESS" && sslResult?.GatewayPageURL) {
      // Store session key
      await Payment.findByIdAndUpdate(payment._id, {
        "sslcommerz.sessionKey": sslResult.sessionkey || "",
      });

      return NextResponse.json({
        success: true,
        message: "Payment session initialized",
        data: {
          paymentUrl: sslResult.GatewayPageURL,
          transactionId,
          paymentId: payment._id,
        },
      });
    } else {
      // Payment initialization failed
      await Payment.findByIdAndUpdate(payment._id, {
        status: "failed",
        errorMessage:
          sslResult?.failedreason || "Failed to initialize payment gateway",
      });

      await Subscription.findByIdAndUpdate(subscription._id, {
        status: "cancelled",
      });

      return NextResponse.json(
        {
          success: false,
          message: "Failed to initialize payment",
          error: sslResult,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logToFile("Payment initialization error:", {
      message: error.message,
      stack: error.stack,
    });
    console.error("Payment initialization error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Payment initialization failed",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
