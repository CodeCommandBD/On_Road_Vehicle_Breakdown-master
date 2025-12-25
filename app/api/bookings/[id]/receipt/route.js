import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import "@/lib/db/models/Service";
import "@/lib/db/models/Garage";
import "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";
import { generateInvoicePDF } from "@/lib/utils/pdfGenerator";
import path from "path";
import fs from "fs";

export async function GET(request, { params }) {
  try {
    await connectDB();
    console.log("Generating receipt for:", params.id);
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const booking = await Booking.findById(id)
      .populate("user", "name email phone")
      .populate("garage", "name address phone email")
      .populate("service", "name");

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Auth check
    const isOwner = booking.user._id.toString() === decoded.userId;
    const isGarage = booking.garage._id.toString() === decoded.userId;
    const isAdmin = decoded.role === "admin";

    if (!isOwner && !isGarage && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Map booking items to invoice format
    const items = [];

    // Base service
    items.push({
      description: `${booking.service?.name || "Vehicle Service"} - Base Fee`,
      quantity: 1,
      unitPrice: booking.estimatedCost,
      amount: booking.estimatedCost,
    });

    // Bill items
    if (booking.billItems && booking.billItems.length > 0) {
      booking.billItems.forEach((item) => {
        items.push({
          description: item.description,
          quantity: 1,
          unitPrice: item.amount,
          amount: item.amount,
        });
      });
    }

    // Towing
    if (booking.towingRequested) {
      items.push({
        description: "Towing Service",
        quantity: 1,
        unitPrice: booking.towingCost || 0,
        amount: booking.towingCost || 0,
      });
    }

    const invoiceData = {
      invoiceNumber: booking.bookingNumber,
      user: {
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone,
      },
      items: items,
      subtotal: booking.actualCost || booking.estimatedCost,
      tax: { rate: 0, amount: 0 },
      discount: 0,
      total: booking.actualCost || booking.estimatedCost,
      currency: "BDT",
      status: booking.isPaid ? "paid" : "unpaid",
      paymentId: booking.paymentId || "N/A",
      paidAt: booking.completedAt || booking.updatedAt,
      createdAt: booking.createdAt,
      notes: `Service provided by ${booking.garage?.name}. Vehicle: ${booking.vehicleInfo?.brand} ${booking.vehicleInfo?.model} (${booking.vehicleInfo?.plateNumber})`,
    };

    // Generate PDF
    const publicDir = path.join(process.cwd(), "public", "pdfs", "receipts");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const filename = `receipt-${booking.bookingNumber}.pdf`;
    const outputPath = path.join(publicDir, filename);

    console.log("Invoice Data:", JSON.stringify(invoiceData, null, 2));
    await generateInvoicePDF(invoiceData, outputPath);
    console.log("PDF generated at:", outputPath);

    const pdfBuffer = fs.readFileSync(outputPath);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Receipt Generation Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate receipt" },
      { status: 500 }
    );
  }
}
