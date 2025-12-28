import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { email, subject, content } = await request.json();

    // Validation
    if (!email || !subject || !content) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, subject, and content are required",
        },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send test email
    await transporter.sendMail({
      from: `"OnRoadHelp Newsletter" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `[TEST] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">OnRoadHelp Newsletter</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">TEST EMAIL</p>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #111; margin-top: 0;">${subject}</h2>
            <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">
              ${content}
            </div>
          </div>
          <div style="background: #111; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} OnRoadHelp. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send test email: " + error.message,
      },
      { status: 500 }
    );
  }
}
