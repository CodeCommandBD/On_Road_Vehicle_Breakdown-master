import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/auth";
import connectDB from "@/lib/db/connect";
import Invoice from "@/lib/db/models/Invoice";
import User from "@/lib/db/models/User";
import { generateInvoicePDF } from "@/lib/utils/invoiceGenerator";
import { sendEmail } from "@/lib/utils/email";

export async function POST(request, { params }) {
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

    const user = await User.findById(decoded.userId);
    const pdfBuffer = await generateInvoicePDF(invoice);

    await sendEmail({
      to: user.email,
      subject: `Invoice #${invoice.invoiceNumber} from On-Road Help`,
      html: `
        <h1>Thank you for your payment!</h1>
        <p>Your invoice #${invoice.invoiceNumber} is attached to this email.</p>
        <p>Total Amount: ${invoice.total} ${invoice.currency}</p>
        <br>
        <p>Best regards,<br>On-Road Help Team</p>
      `,
      attachments: [
        {
          filename: `Invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Invoice sent successfully",
    });
  } catch (error) {
    console.error("Invoice Send Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send invoice" },
      { status: 500 }
    );
  }
}
