import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Booking from "@/lib/db/models/Booking";
import Service from "@/lib/db/models/Service";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all services
    const allServices = await Service.find({ isActive: true }).lean();

    // Get bookings with service details
    const bookings = await Booking.find({
      createdAt: { $gte: startDate },
    })
      .populate("service", "name category basePrice")
      .lean();

    // Calculate statistics
    const stats = {
      totalServices: allServices.length,
      activeServices: allServices.filter((s) => s.isActive).length,
      totalBookings: bookings.length,
      totalRevenue: 0,
    };

    // Service-wise analysis
    const serviceMap = new Map();

    bookings.forEach((booking) => {
      if (!booking.service) return;

      const serviceId = booking.service._id.toString();
      const serviceName = booking.service.name;
      const price = booking.totalPrice || booking.service.basePrice || 0;

      if (!serviceMap.has(serviceId)) {
        serviceMap.set(serviceId, {
          id: serviceId,
          name: serviceName,
          category: booking.service.category,
          requests: 0,
          revenue: 0,
          completed: 0,
          pending: 0,
          cancelled: 0,
        });
      }

      const serviceData = serviceMap.get(serviceId);
      serviceData.requests++;
      serviceData.revenue += price;
      stats.totalRevenue += price;

      // Count by status
      if (booking.status === "completed") serviceData.completed++;
      else if (booking.status === "cancelled") serviceData.cancelled++;
      else serviceData.pending++;
    });

    // Convert to array and sort
    const servicesArray = Array.from(serviceMap.values());

    // Top 5 Most Requested Services
    const topServices = [...servicesArray]
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5)
      .map((s) => ({
        name: s.name,
        requests: s.requests,
      }));

    // Top 5 Revenue Generating Services
    const topRevenueServices = [...servicesArray]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((s) => ({
        name: s.name,
        revenue: s.revenue,
      }));

    // Category-wise breakdown
    const categoryMap = new Map();
    servicesArray.forEach((service) => {
      const cat = service.category || "other";
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {
          category: cat,
          requests: 0,
          revenue: 0,
        });
      }
      const catData = categoryMap.get(cat);
      catData.requests += service.requests;
      catData.revenue += service.revenue;
    });

    const categoryBreakdown = Array.from(categoryMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );

    // Completion rate
    const totalCompleted = servicesArray.reduce(
      (sum, s) => sum + s.completed,
      0
    );
    const completionRate =
      bookings.length > 0
        ? Math.round((totalCompleted / bookings.length) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          ...stats,
          completionRate,
        },
        topServices,
        topRevenueServices,
        categoryBreakdown,
        servicesDetailed: servicesArray.sort((a, b) => b.revenue - a.revenue),
      },
    });
  } catch (error) {
    console.error("Error fetching service analytics:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch service analytics",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
