import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/auth";
import { sendEmail } from "@/lib/utils/email";
import connectDB from "@/lib/db/connect";
import RevenueMetrics from "@/lib/db/models/RevenueMetrics";

export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { email, reportType, dateRange } = await request.json();
    const targetEmail = email || decoded.email;

    await connectDB();

    // Fetch brief data for the email
    const metrics = await RevenueMetrics.findOne({
      period: "daily",
    }).sort({ date: -1 });

    const mrr = metrics?.mrr?.total || 0;
    const active = metrics?.customers?.active || 0;

    // Construct Email Content
    const subject = `Analytics Report: ${reportType.toUpperCase()} - ${dateRange} days`;
    const html = `
      <h1>Analytics Report Summary</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <hr />
      <h3>Key Metrics (Latest)</h3>
      <ul>
        <li><strong>MRR:</strong> BDT ${mrr.toLocaleString()}</li>
        <li><strong>Active Customers:</strong> ${active}</li>
      </ul>
      <p>For detailed charts and tables, please visit your <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/admin/analytics">Admin Dashboard</a>.</p>
      <br />
      <p>Best regards,<br/>OnRoad Breakdown Support</p>
    `;

    await sendEmail({
      to: targetEmail,
      subject,
      html,
    });

    return NextResponse.json({
      success: true,
      message: "Report sent successfully",
    });
  } catch (error) {
    console.error("Email report error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send report" },
      { status: 500 }
    );
  }
}
