import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";

export async function GET() {
  try {
    await connectDB();

    const targetEmail = "admin@quickservice.com";
    const targetPassword = "admin123";

    // Check if this specific admin exists
    let adminUser = await User.findOne({ email: targetEmail });

    if (adminUser) {
      // Update existing admin password to match request
      adminUser.password = targetPassword;
      adminUser.role = "admin"; // Ensure role is admin
      await adminUser.save();

      return NextResponse.json({
        success: true,
        message: "Admin account updated successfully.",
        credentials: {
          email: targetEmail,
          password: targetPassword,
        },
      });
    }

    // Create new admin if doesn't exist
    const newAdmin = await User.create({
      name: "System Admin",
      email: targetEmail,
      password: targetPassword,
      role: "admin",
      phone: "01700000000", // Placeholder phone
      membershipTier: "enterprise",
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully.",
      credentials: {
        email: targetEmail,
        password: targetPassword,
      },
    });
  } catch (error) {
    console.error("Seed Admin Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
