import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Newsletter from "@/lib/models/Newsletter";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    await dbConnect();

    const { subject, content } = await request.json();

    // Validation
    if (!subject || !content) {
      return NextResponse.json(
        {
          success: false,
          message: "Subject and content are required",
        },
        { status: 400 }
      );
    }

    // Get all active subscribers
    const subscribers = await Newsletter.find({ isActive: true });

    if (subscribers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No active subscribers found",
        },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send emails to all subscribers
    let sentCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      try {
        await transporter.sendMail({
          from: `"OnRoadHelp Newsletter" <${process.env.SMTP_USER}>`,
          to: subscriber.email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">OnRoadHelp Newsletter</h1>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #111; margin-top: 0;">${subject}</h2>
                <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">
                  ${content}
                </div>
              </div>
              <div style="background: #111; padding: 20px; text-align: center;">
                <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 12px;">
                  © ${new Date().getFullYear()} OnRoadHelp. All rights reserved.
                </p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${
            subscriber.email
          }" 
                   style="color: #f97316; text-decoration: none; font-size: 12px;">
                  Unsubscribe
                </a>
              </div>
            </div>
          `,
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${sentCount} subscribers`,
      data: {
        sentCount,
        failedCount,
        totalSubscribers: subscribers.length,
      },
    });
  } catch (error) {
    console.error("Error sending bulk newsletter:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send newsletter: " + error.message,
      },
      { status: 500 }
    );
  }
}
