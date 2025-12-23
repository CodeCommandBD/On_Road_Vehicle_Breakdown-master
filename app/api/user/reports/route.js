import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import SOS from "@/lib/db/models/SOS";
import Booking from "@/lib/db/models/Booking";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import TeamMember from "@/lib/db/models/TeamMember";
import { verifyToken } from "@/lib/utils/auth";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days")) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Tier Check: Only Premium and Enterprise (and Admins obviously)
    if (
      user.role !== "admin" &&
      user.membershipTier !== "premium" &&
      user.membershipTier !== "enterprise"
    ) {
      return NextResponse.json(
        { success: false, error: "Advanced Analytics is a Premium feature." },
        { status: 403 }
      );
    }

    let query = {};
    let bookingQuery = {};

    // Define query based on role
    if (user.role === "admin") {
      // Admin sees everything
      query = { createdAt: { $gte: startDate } };
      bookingQuery = { createdAt: { $gte: startDate } };
    } else if (user.role === "garage") {
      const garage = await Garage.findOne({ owner: user._id });
      if (garage) {
        query = { assignedGarage: garage._id, createdAt: { $gte: startDate } };
        bookingQuery = { garage: garage._id, createdAt: { $gte: startDate } };
      } else {
        query = { user: user._id, createdAt: { $gte: startDate } };
        bookingQuery = { user: user._id, createdAt: { $gte: startDate } };
      }
    } else {
      // Regular or Enterprise User
      // If enterprise owner, show team stats too
      if (user.membershipTier === "enterprise") {
        const Organization = (await import("@/lib/db/models/Organization"))
          .default;
        const org = await Organization.findOne({ owner: user._id });
        if (org) {
          const members = await TeamMember.find({ organization: org._id });
          const memberIds = members.map((m) => m.user);
          query = {
            user: { $in: [user._id, ...memberIds] },
            createdAt: { $gte: startDate },
          };
          bookingQuery = {
            user: { $in: [user._id, ...memberIds] },
            createdAt: { $gte: startDate },
          };
        } else {
          query = { user: user._id, createdAt: { $gte: startDate } };
          bookingQuery = { user: user._id, createdAt: { $gte: startDate } };
        }
      } else {
        query = { user: user._id, createdAt: { $gte: startDate } };
        bookingQuery = { user: user._id, createdAt: { $gte: startDate } };
      }
    }

    // 1. SOS Trend (By Day)
    const sosTrend = await SOS.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 2. SOS Status Distribution
    const sosStatus = await SOS.aggregate([
      { $match: query },
      { $group: { _id: "$status", value: { $sum: 1 } } },
    ]);

    // 3. Booking / Service Popularity
    const servicePopularity = await Booking.aggregate([
      { $match: bookingQuery },
      {
        $lookup: {
          from: "services",
          localField: "service",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },
      { $unwind: "$serviceDetails" },
      { $group: { _id: "$serviceDetails.name", value: { $sum: 1 } } },
    ]);

    // 4. Revenue Trend (Completed bookings with actualCost)
    const revenueStats = await Booking.aggregate([
      {
        $match: {
          ...bookingQuery,
          status: "completed",
          actualCost: { $ne: null },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$actualCost" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 5. Location Hotspots
    const hotspots = await SOS.aggregate([
      { $match: query },
      { $group: { _id: "$location.address", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // 6. Team Performance (Enterprise Only)
    let teamPerformance = [];
    if (user.membershipTier === "enterprise") {
      teamPerformance = await SOS.aggregate([
        { $match: query },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        { $unwind: "$userDetails" },
        { $group: { _id: "$userDetails.name", sos: { $sum: 1 } } },
        { $sort: { sos: -1 } },
      ]);
    }

    return NextResponse.json({
      success: true,
      data: {
        sosTrend,
        sosStatus,
        servicePopularity,
        revenueStats,
        hotspots,
        teamPerformance,
        summary: {
          totalSOS: sosStatus.reduce((acc, curr) => acc + curr.value, 0),
          totalBookings: servicePopularity.reduce(
            (acc, curr) => acc + curr.value,
            0
          ),
          totalRevenue: revenueStats.reduce(
            (acc, curr) => acc + curr.revenue,
            0
          ),
        },
      },
    });
  } catch (error) {
    console.error("Reports API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
