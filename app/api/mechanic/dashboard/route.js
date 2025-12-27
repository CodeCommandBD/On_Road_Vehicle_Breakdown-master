import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Booking from "@/lib/db/models/Booking";
import JobCard from "@/lib/db/models/JobCard";
import Attendance from "@/lib/db/models/Attendance";
import { verifyToken } from "@/lib/utils/auth";

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

    const mechanic = await User.findById(decoded.userId).populate("garageId");
    if (!mechanic) {
      return NextResponse.json(
        { success: false, message: "Mechanic not found" },
        { status: 404 }
      );
    }

    // 1. Fetch Attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({
      user: decoded.userId,
      date: today,
    });

    // 2. Fetch Active Jobs (assigned to this mechanic)
    // We must include all active phases defined in the new workflow:
    // confirmed -> on_the_way -> diagnosing -> estimate_sent -> in_progress -> payment_pending
    const activeJobStatuses = [
      "confirmed",
      "on_the_way",
      "diagnosing",
      "estimate_sent",
      "in_progress",
      "payment_pending",
    ];

    let activeJobs = await Booking.find({
      assignedMechanic: decoded.userId,
      status: { $in: activeJobStatuses },
    })
      .populate("user", "name phone location")
      .lean();

    // Check for Job Cards (Diagnosis Reports)
    if (activeJobs.length > 0) {
      const activeJobIds = activeJobs.map((job) => job._id);
      const jobCards = await JobCard.find({
        booking: { $in: activeJobIds },
      }).select("booking");
      const jobCardSet = new Set(jobCards.map((jc) => jc.booking.toString()));

      activeJobs = activeJobs.map((job) => ({
        ...job,
        hasJobCard: jobCardSet.has(job._id.toString()),
      }));
    }

    // 3. Fetch Open Jobs (for the same garage, not assigned)
    let openJobs = [];
    if (mechanic.garageId) {
      openJobs = await Booking.find({
        garage: mechanic.garageId._id,
        status: { $in: ["pending", "confirmed"] },
        assignedMechanic: null,
      })
        .populate("user", "name phone location")
        .sort({ createdAt: -1 });
    }

    // 4. Calculate Stats
    // For "Today", let's count completed jobs where completedAt is today
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const completedToday = await Booking.countDocuments({
      assignedMechanic: decoded.userId,
      status: "completed",
      completedAt: { $gte: today, $lt: tomorrow },
    });

    const stats = {
      points: mechanic.rewardPoints || 0,
      completedToday: completedToday,
      rating: mechanic.mechanicProfile?.rating?.average || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        mechanic: {
          name: mechanic.name,
          availability: mechanic.availability,
        },
        attendance,
        activeJobs,
        openJobs,
        stats,
      },
    });
  } catch (error) {
    console.error("Mechanic Dashboard API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
