"use client";

import ChartComponent from "@/components/charts/ChartComponent";

export default function AnalyticsDashboard({ stats }) {
  // Default mock data if no stats provided
  const revenueData = stats?.revenue || [
    { name: "Jan", value: 4000 },
    { name: "Feb", value: 3000 },
    { name: "Mar", value: 2000 },
    { name: "Apr", value: 2780 },
    { name: "May", value: 1890 },
    { name: "Jun", value: 2390 },
  ];

  const serviceData = stats?.services || [
    { name: "Tow", value: 24 },
    { name: "Repair", value: 13 },
    { name: "Fuel", value: 8 },
    { name: "Tire", value: 18 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Revenue Overview
          </h3>
          <ChartComponent type="line" data={revenueData} color="#10b981" />
        </div>

        {/* Service Requests Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Service Requests
          </h3>
          <ChartComponent type="bar" data={serviceData} color="#3b82f6" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total Bookings</p>
          <p className="text-2xl font-bold text-blue-900">
            {stats?.totalBookings || 124}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Total Revenue</p>
          <p className="text-2xl font-bold text-green-900">
            ৳{stats?.totalRevenue || "45,200"}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">
            Active Mechanics
          </p>
          <p className="text-2xl font-bold text-purple-900">
            {stats?.activeMechanics || 8}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-orange-600 font-medium">Avg. Response</p>
          <p className="text-2xl font-bold text-orange-900">
            {stats?.avgResponse || "15m"}
          </p>
        </div>
      </div>
    </div>
  );
}
