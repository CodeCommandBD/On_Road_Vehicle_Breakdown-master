import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Newsletter from "@/lib/models/Newsletter";
import { sendNewsletterConfirmation } from "@/lib/utils/email";

export async function POST(request) {
  try {
    await dbConnect();

    const { email } = await request.json();

    // Validation
    if (!email || !email.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Email address is required",
        },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address",
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return NextResponse.json(
          {
            success: false,
            message: "This email is already subscribed to our newsletter",
          },
          { status: 409 }
        );
      } else {
        // Reactivate subscription
        existingSubscriber.isActive = true;
        existingSubscriber.subscribedAt = new Date();
        await existingSubscriber.save();

        // Send welcome back email
        await sendNewsletterConfirmation(email.toLowerCase().trim());

        return NextResponse.json({
          success: true,
          message:
            "Welcome back! Your subscription has been reactivated. Check your inbox!",
        });
      }
    }

    // Create new subscriber
    const newSubscriber = await Newsletter.create({
      email: email.toLowerCase().trim(),
      isActive: true,
      subscribedAt: new Date(),
    });

    // Send confirmation email
    const emailResult = await sendNewsletterConfirmation(newSubscriber.email);

    if (emailResult.success) {
      console.log(`✅ Newsletter confirmation sent to ${newSubscriber.email}`);
    } else {
      console.error(`❌ Failed to send confirmation: ${emailResult.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Successfully subscribed! Check your inbox for confirmation.",
        data: {
          email: newSubscriber.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while processing your subscription",
      },
      { status: 500 }
    );
  }
}
