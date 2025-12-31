import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { sendSupportTicketEmail } from "@/lib/utils/email";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";

/**
 * POST /api/contact-sales
 * Handle enterprise sales inquiries
 */
export async function POST(request) {
  // Rate limiting: 3 messages per hour to prevent spam
  const rateLimitResult = rateLimitMiddleware(request, 3, 60 * 60 * 1000);
  if (rateLimitResult) return rateLimitResult;

  try {
    await connectDB();
    const body = await request.json();
    const { name, email, phone, company, message } = body;

    // Validation
    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, phone, and message are required",
        },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email address",
        },
        { status: 400 }
      );
    }

    // Send email to sales team
    try {
      await sendSupportTicketEmail({
        user: { name, email },
        subject: `Enterprise Inquiry from ${company || name}`,
        message: `
Company: ${company || "N/A"}
Name: ${name}
Email: ${email}
Phone: ${phone}

Message:
${message}
        `,
        planTier: "enterprise",
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // Continue even if email fails
    }

    // Create notification for all admins
    try {
      const User = (await import("@/lib/db/models/User")).default;
      const Notification = (await import("@/lib/db/models/Notification"))
        .default;

      const admins = await User.find({ role: "admin" }).select("_id");

      const notificationPromises = admins.map((admin) =>
        Notification.create({
          recipient: admin._id,
          type: "system_alert",
          title: "🎯 New Enterprise Inquiry",
          message: `${name} from ${
            company || "a company"
          } submitted an enterprise inquiry. Contact: ${phone}`,
          link: "/admin/inquiries", // Redirect to inquiries page
        })
      );

      await Promise.all(notificationPromises);
    } catch (notifyError) {
      console.error("Failed to create notifications:", notifyError);
      // Don't fail the request if notification fails
    }

    // Save inquiry to database
    const ContactInquiry = (await import("@/lib/db/models/ContactInquiry"))
      .default;
    const inquiry = await ContactInquiry.create({
      name,
      email,
      phone,
      company,
      message,
      status: "new",
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! We'll contact you shortly.",
      data: { inquiryId: inquiry._id },
    });
  } catch (error) {
    console.error("Contact Sales API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
