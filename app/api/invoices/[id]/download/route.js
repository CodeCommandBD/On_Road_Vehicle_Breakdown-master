import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/auth";
import connectDB from "@/lib/db/connect";
import Invoice from "@/lib/db/models/Invoice";
import { generateInvoicePDF } from "@/lib/utils/invoiceGenerator";

export async function GET(request, { params }) {
  try {
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);
    const { id } = await params;

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const invoice = await Invoice.findOne({ _id: id, userId: decoded.userId });

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found" },
        { status: 404 }
      );
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`
    );

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Invoice Download Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
