import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Support from "@/lib/db/models/Support";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";

// Middleware to check admin role
async function checkAdmin(request) {
  const token = request.cookies.get("token")?.value;
  const decoded = await verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

// GET: Fetch all tickets
export async function GET(request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    let query = {};

    if (status && status !== "All") {
      query.status = status.toLowerCase();
    }

    if (priority && priority !== "All") {
      query.priority = priority.toLowerCase();
    }

    // Search logic
    if (search) {
      // Find users matching search term
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const userIds = users.map((user) => user._id);

      query.$or = [
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
        { userId: { $in: userIds } },
      ];
    }

    const tickets = await Support.find(query)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error("Support GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update ticket status
export async function PATCH(request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    await connectDB();
    const { ticketId, status } = await request.json();

    if (!ticketId || !status) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const ticket = await Support.findByIdAndUpdate(
      ticketId,
      { status: status.toLowerCase() },
      { new: true }
    );

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    console.error("Support PATCH Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
