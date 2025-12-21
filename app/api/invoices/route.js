import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Invoice from "@/lib/db/models/Invoice";
import User from "@/lib/db/models/User";
import Subscription from "@/lib/db/models/Subscription";
import { verifyToken } from "@/lib/utils/auth";

/**
 * GET /api/invoices
 * Fetch invoices for current user or all (admin only)
 */
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = {};

    // Role-based filtering
    if (decoded.role === "admin") {
      if (status) {
        query.status = status;
      }
    } else {
      // Users can only see their own invoices
      query.userId = decoded.userId;
      if (status) {
        query.status = status;
      }
    }

    const invoices = await Invoice.find(query)
      .populate("userId", "name email phone")
      .populate("subscriptionId", "planId billingCycle")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: { invoices },
    });
  } catch (error) {
    console.error("Invoice GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices
 * Create a new invoice (Usually auto-generated, but can be manual)
 */
export async function POST(request) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      userId,
      subscriptionId,
      items,
      tax,
      discount,
      currency,
      dueDate,
      billingAddress,
      notes,
    } = body;

    // Validation
    if (!userId || !items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID and items are required",
        },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Create invoice
    const invoice = new Invoice({
      userId,
      subscriptionId,
      items,
      tax: tax || { rate: 0, amount: 0 },
      discount: discount || 0,
      currency: currency || "BDT",
      dueDate: dueDate ? new Date(dueDate) : null,
      billingAddress: billingAddress || {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      notes,
      status: "issued",
    });

    // Calculate totals
    invoice.calculateTotals();
    await invoice.save();

    // Link invoice to subscription if provided
    if (subscriptionId) {
      await Subscription.findByIdAndUpdate(subscriptionId, {
        $push: { invoices: invoice._id },
      });
    }

    await invoice.populate("userId subscriptionId");

    return NextResponse.json({
      success: true,
      data: { invoice },
      message: "Invoice created successfully",
    });
  } catch (error) {
    console.error("Invoice POST Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/invoices
 * Update invoice status (mark as paid, cancelled, etc.)
 */
export async function PATCH(request) {
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

    const body = await request.json();
    const { invoiceId, status, paymentId, paymentMethod } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, message: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found" },
        { status: 404 }
      );
    }

    // Authorization check (admin or invoice owner)
    const isOwner = invoice.userId.toString() === decoded.userId;
    const isAdmin = decoded.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to modify this invoice" },
        { status: 403 }
      );
    }

    // Update invoice
    if (status) {
      invoice.status = status;
      if (status === "paid") {
        invoice.paidAt = new Date();
      }
    }

    if (paymentId) invoice.paymentId = paymentId;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;

    await invoice.save();
    await invoice.populate("userId subscriptionId");

    return NextResponse.json({
      success: true,
      data: { invoice },
      message: "Invoice updated successfully",
    });
  } catch (error) {
    console.error("Invoice PATCH Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
