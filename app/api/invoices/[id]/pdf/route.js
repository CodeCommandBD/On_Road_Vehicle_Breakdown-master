import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Invoice from "@/lib/db/models/Invoice";
import { verifyToken } from "@/lib/utils/auth";
import { generateInvoicePDF } from "@/lib/utils/pdfGenerator";
import path from "path";
import fs from "fs";

/**
 * GET /api/invoices/[id]/pdf
 * Generate and download invoice PDF
 */
export async function GET(request, { params }) {
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

    const invoice = await Invoice.findById(id).populate(
      "userId",
      "name email phone"
    );

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found" },
        { status: 404 }
      );
    }

    // Authorization check
    const isOwner = invoice.userId._id.toString() === decoded.userId;
    const isAdmin = decoded.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to access this invoice" },
        { status: 403 }
      );
    }

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      user: {
        name: invoice.userId.name,
        email: invoice.userId.email,
        phone: invoice.userId.phone,
      },
      items: invoice.items,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount,
      total: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
      paymentId: invoice.paymentId,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      billingAddress: invoice.billingAddress,
      notes: invoice.notes,
      createdAt: invoice.createdAt,
    };

    // Generate PDF
    const publicDir = path.join(process.cwd(), "public", "pdfs", "invoices");

    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const filename = `invoice-${invoice.invoiceNumber}.pdf`;
    const outputPath = path.join(publicDir, filename);

    await generateInvoicePDF(invoiceData, outputPath);

    // Update invoice with PDF URL
    if (!invoice.pdfUrl) {
      invoice.pdfUrl = `/pdfs/invoices/${filename}`;
      await invoice.save();
    }

    // Read the file and return as response
    const pdfBuffer = fs.readFileSync(outputPath);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Invoice PDF Generation Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate PDF",
      },
      { status: 500 }
    );
  }
}
