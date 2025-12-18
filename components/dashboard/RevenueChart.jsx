"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function RevenueChart({ bookings }) {
  // Calculate monthly revenue for last 6 months
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [];

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("en-US", { month: "short" });

      months.push({
        key: monthKey,
        name: monthName,
        revenue: 0,
      });
    }

    // Calculate revenue for each month
    bookings.forEach((booking) => {
      if (booking.status === "completed" && booking.estimatedCost) {
        const date = new Date(booking.createdAt);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        const month = months.find((m) => m.key === monthKey);
        if (month) {
          month.revenue += booking.estimatedCost;
        }
      }
    });

    return months;
  }, [bookings]);

  const maxRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1);
  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);

  // Calculate trend (comparing last month vs previous month)
  const lastMonth = monthlyData[monthlyData.length - 1]?.revenue || 0;
  const previousMonth = monthlyData[monthlyData.length - 2]?.revenue || 0;
  const trend =
    previousMonth > 0 ? ((lastMonth - previousMonth) / previousMonth) * 100 : 0;

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">
            Revenue Overview
          </h3>
          <p className="text-2xl font-bold text-orange-500">
            ৳{totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {trend > 0 ? (
            <TrendingUp className="w-5 h-5 text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-400" />
          )}
          <span
            className={`text-sm font-medium ${
              trend > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {Math.abs(trend).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="space-y-3">
        {monthlyData.map((month, index) => (
          <div key={month.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">{month.name}</span>
              <span className="text-white font-medium">
                ৳{month.revenue.toLocaleString()}
              </span>
            </div>
            <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 ease-out rounded-lg"
                style={{ width: `${(month.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
