"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  TrendingUp,
  DollarSign,
  Wrench,
  CheckCircle,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ServiceAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [timeFilter]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/admin/analytics/services?days=${timeFilter}`
      );
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-16">
        <p className="text-white/60">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-orange-500" />
            Service Analytics
          </h1>
          <p className="text-white/60 text-sm">
            Performance metrics and insights
          </p>
        </div>

        {/* Time Filter */}
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(parseInt(e.target.value))}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Wrench className="text-blue-500" size={24} />
            </div>
          </div>
          <h3 className="text-white/60 text-sm mb-1">Total Services</h3>
          <p className="text-3xl font-bold text-white">
            {analytics.overview.totalServices}
          </p>
          <p className="text-xs text-green-500 mt-2">
            {analytics.overview.activeServices} Active
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="text-purple-500" size={24} />
            </div>
          </div>
          <h3 className="text-white/60 text-sm mb-1">Total Bookings</h3>
          <p className="text-3xl font-bold text-white">
            {analytics.overview.totalBookings}
          </p>
          <p className="text-xs text-white/40 mt-2">Last {timeFilter} days</p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <DollarSign className="text-orange-500" size={24} />
            </div>
          </div>
          <h3 className="text-white/60 text-sm mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-white">
            ৳{analytics.overview.totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-white/40 mt-2">From services</p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
          <h3 className="text-white/60 text-sm mb-1">Completion Rate</h3>
          <p className="text-3xl font-bold text-white">
            {analytics.overview.completionRate}%
          </p>
          <p className="text-xs text-green-500 mt-2">Of all bookings</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Requested Services */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Most Requested Services
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topServices}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="name"
                stroke="#888"
                tick={{ fill: "#888", fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#888" tick={{ fill: "#888" }} />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="requests" fill="#FF6B6B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Category */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Revenue by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.categoryBreakdown}
                dataKey="revenue"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) =>
                  `${entry.category
                    .split("-")
                    .join(" ")}: ৳${entry.revenue.toLocaleString()}`
                }
              >
                {analytics.categoryBreakdown.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Service Performance Details
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-wider border-b border-white/10">
                <th className="pb-4 font-medium">Service Name</th>
                <th className="pb-4 font-medium">Category</th>
                <th className="pb-4 font-medium text-right">Requests</th>
                <th className="pb-4 font-medium text-right">Revenue</th>
                <th className="pb-4 font-medium text-right">Completed</th>
                <th className="pb-4 font-medium text-right">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {analytics.servicesDetailed.map((service, index) => (
                <tr
                  key={service.id}
                  className="text-sm text-white/80 hover:bg-white/5"
                >
                  <td className="py-4 font-medium text-white">
                    {service.name}
                  </td>
                  <td className="py-4 text-white/60">
                    {service.category?.split("-").join(" ") || "N/A"}
                  </td>
                  <td className="py-4 text-right">{service.requests}</td>
                  <td className="py-4 text-right text-orange-500 font-bold">
                    ৳{service.revenue.toLocaleString()}
                  </td>
                  <td className="py-4 text-right text-green-500">
                    {service.completed}
                  </td>
                  <td className="py-4 text-right">
                    {service.requests > 0
                      ? Math.round((service.completed / service.requests) * 100)
                      : 0}
                    %
                  </td>
                </tr>
              ))}
              {analytics.servicesDetailed.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/40">
                    No service data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
