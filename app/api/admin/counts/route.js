import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import ContactInquiry from "@/lib/db/models/ContactInquiry";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import Booking from "@/lib/db/models/Booking";
import SOS from "@/lib/db/models/SOS";
import { verifyToken } from "@/lib/utils/auth";

async function checkAdmin(request) {
  const token = request.cookies.get("token")?.value;
  const decoded = await verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

/**
 * GET /api/admin/counts
 * Get comprehensive dashboard statistics (admin only)
 */
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

    // Date calculations
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Parallel queries for performance
    const [
      totalUsers,
      usersLastMonth,
      usersPreviousMonth,
      totalGarages,
      verifiedGarages,
      garagesLastMonth,
      garagesPreviousMonth,
      totalBookings,
      bookingsLastMonth,
      bookingsPreviousMonth,
      pendingBookings,
      activeSOS,
      newInquiries,
      pendingSupport,
    ] = await Promise.all([
      // Users
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
      }),

      // Garages
      Garage.countDocuments(),
      Garage.countDocuments({ isVerified: true }),
      Garage.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Garage.countDocuments({
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
      }),

      // Bookings
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Booking.countDocuments({
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
      }),
      Booking.countDocuments({ status: "pending" }),

      // SOS
      SOS.countDocuments({ status: { $in: ["pending", "assigned"] } }),

      // Inquiries
      ContactInquiry.countDocuments({ status: "new" }),

      // Support tickets
      Support.countDocuments({ status: "pending" }).catch(() => 0),
    ]);

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const userGrowth = calculateGrowth(usersLastMonth, usersPreviousMonth);
    const garageGrowth = calculateGrowth(
      garagesLastMonth,
      garagesPreviousMonth
    );
    const bookingGrowth = calculateGrowth(
      bookingsLastMonth,
      bookingsPreviousMonth
    );

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          growth: userGrowth,
          newThisMonth: usersLastMonth,
        },
        garages: {
          total: totalGarages,
          verified: verifiedGarages,
          growth: garageGrowth,
          newThisMonth: garagesLastMonth,
        },
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          growth: bookingGrowth,
          thisMonth: bookingsLastMonth,
        },
        sos: {
          active: activeSOS,
        },
        inquiries: newInquiries,
        support: pendingSupport,
      },
    });
  } catch (error) {
    console.error("Admin Counts Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Import Support model dynamically to avoid errors if it doesn't exist
const Support = {
  countDocuments: async () => {
    try {
      const SupportModel = (await import("@/lib/db/models/Support")).default;
      return SupportModel.countDocuments.apply(SupportModel, arguments);
    } catch {
      return 0;
    }
  },
};
