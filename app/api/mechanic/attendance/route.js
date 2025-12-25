import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Attendance from "@/lib/db/models/Attendance";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";

// GET: Check today's status
export async function GET(request) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "mechanic") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: decoded.userId,
      date: today,
    });

    return NextResponse.json({
      success: true,
      status: attendance
        ? attendance.clockOut
          ? "clocked_out"
          : "clocked_in"
        : "not_started",
      data: attendance,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error fetching attendance" },
      { status: 500 }
    );
  }
}

// POST: Clock In / Clock Out
export async function POST(request) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "mechanic") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { action, location } = await request.json(); // action: 'in' | 'out'
    const mechanic = await User.findById(decoded.userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      user: decoded.userId,
      date: today,
    });

    if (action === "in") {
      if (attendance) {
        return NextResponse.json(
          { success: false, message: "Already clocked in today" },
          { status: 400 }
        );
      }

      attendance = await Attendance.create({
        user: decoded.userId,
        garage: mechanic.garageId,
        date: today,
        clockIn: new Date(),
        status: "present",
      });

      // Auto-set availability to online
      mechanic.availability.status = "online";
      mechanic.availability.lastUpdated = new Date();
      await mechanic.save();
    } else if (action === "out") {
      if (!attendance) {
        return NextResponse.json(
          { success: false, message: "Not clocked in yet" },
          { status: 400 }
        );
      }

      const now = new Date();
      attendance.clockOut = now;

      // Calculate hours
      const diffMs = now - new Date(attendance.clockIn);
      const diffHrs = diffMs / (1000 * 60 * 60);
      attendance.totalHours = parseFloat(diffHrs.toFixed(2));

      await attendance.save();

      // Auto-set availability to offline
      mechanic.availability.status = "offline";
      mechanic.availability.lastUpdated = new Date();
      await mechanic.save();
    }

    return NextResponse.json({
      success: true,
      message:
        action === "in"
          ? "Clocked In Successfully"
          : "Clocked Out Successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Attendance API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
