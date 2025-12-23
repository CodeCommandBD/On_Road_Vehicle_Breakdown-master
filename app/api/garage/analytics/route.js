import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import Review from "@/lib/db/models/Review";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get("garageId");
    const days = parseInt(searchParams.get("days") || "30");

    if (!garageId) {
      return NextResponse.json(
        { success: false, message: "Garage ID is required" },
        { status: 400 }
      );
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get bookings for this garage
    const bookings = await Booking.find({
      garage: garageId,
      createdAt: { $gte: startDate },
    })
      .populate("service", "name category")
      .populate("user", "name")
      .lean();

    // Get reviews for this garage
    const reviews = await Review.find({
      garage: garageId,
      createdAt: { $gte: startDate },
    }).lean();

    // Calculate overview metrics
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + (b.totalPrice || 0),
      0
    );
    const completedBookings = bookings.filter(
      (b) => b.status === "completed"
    ).length;
    const completionRate =
      totalBookings > 0
        ? Math.round((completedBookings / totalBookings) * 100)
        : 0;

    const avgRating =
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ).toFixed(1)
        : 0;

    // Revenue trend (daily for last period)
    const revenueTrend = [];
    const servicePopularity = new Map();
    const statusDistribution = {
      pending: 0,
      confirmed: 0,
      "in-progress": 0,
      completed: 0,
      cancelled: 0,
    };

    // Process bookings for charts
    bookings.forEach((booking) => {
      // Revenue trend
      const day = new Date(booking.createdAt).toLocaleDateString();
      const existing = revenueTrend.find((r) => r.date === day);
      if (existing) {
        existing.revenue += booking.totalPrice || 0;
        existing.count++;
      } else {
        revenueTrend.push({
          date: day,
          revenue: booking.totalPrice || 0,
          count: 1,
        });
      }

      // Service popularity
      if (booking.service) {
        const serviceName = booking.service.name;
        const current = servicePopularity.get(serviceName) || {
          count: 0,
          revenue: 0,
        };
        current.count++;
        current.revenue += booking.totalPrice || 0;
        servicePopularity.set(serviceName, current);
      }

      // Status distribution
      if (statusDistribution.hasOwnProperty(booking.status)) {
        statusDistribution[booking.status]++;
      }
    });

    // Top services
    const topServices = Array.from(servicePopularity.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Status chart data
    const statusChart = Object.entries(statusDistribution).map(
      ([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
      })
    );

    // Peak hours analysis
    const hourlyDistribution = new Array(24).fill(0);
    bookings.forEach((booking) => {
      const hour = new Date(booking.createdAt).getHours();
      hourlyDistribution[hour]++;
    });

    const peakHours = hourlyDistribution
      .map((count, hour) => ({ hour, count }))
      .filter((h) => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalBookings,
          totalRevenue,
          avgRating: parseFloat(avgRating),
          completionRate,
          period: `Last ${days} days`,
        },
        charts: {
          revenueTrend: revenueTrend.sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          ),
          servicePopularity: topServices,
          statusDistribution: statusChart,
          peakHours,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching garage analytics:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch analytics",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
