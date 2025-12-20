import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { sendSupportTicketEmail } from "@/lib/utils/email";
import User from "@/lib/db/models/User";
import Subscription from "@/lib/db/models/Subscription";
import { verifyToken } from "@/lib/utils/auth"; // Assuming auth helper exists

export async function POST(req) {
  try {
    await connectDB();

    // Auth Check
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { subject, message } = await req.json();

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, message: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Fetch user details + Current Plan
    const dbUser = await User.findById(user.userId);
    const subscription = await Subscription.findOne({
      user: user.userId,
      status: "active",
    }).populate("planId");

    const planTier = subscription?.planId?.tier || "free";

    // Send Email
    const emailResult = await sendSupportTicketEmail({
      user: { name: dbUser.name, email: dbUser.email },
      subject,
      message,
      planTier,
    });

    if (!emailResult.success) {
      throw new Error("Failed to send email");
    }

    return NextResponse.json({
      success: true,
      message: "Support ticket sent successfully",
      isVip: ["premium", "enterprise"].includes(planTier),
    });
  } catch (error) {
    console.error("Support API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send support ticket" },
      { status: 500 }
    );
  }
}
