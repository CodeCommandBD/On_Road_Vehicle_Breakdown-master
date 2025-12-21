"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, DollarSign, AlertTriangle, Activity } from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8B5CF6"];

export default function AnalyticsCharts({ data }) {
  const {
    overview,
    bookingStats,
    costAnalysis,
    sosHistory,
    subscriptionUsage,
    healthScore,
    isMockData,
  } = data;

  // Determine health status
  const getHealthStatus = (score) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-400" };
    if (score >= 60) return { label: "Good", color: "text-blue-400" };
    if (score >= 40) return { label: "Fair", color: "text-yellow-400" };
    return { label: "Needs Attention", color: "text-red-400" };
  };

  const healthStatus = getHealthStatus(healthScore);

  return (
    <div className="space-y-6">
      {/* Mock Data Warning */}
      {isMockData && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-400 text-sm">
            📊 Showing sample data for demonstration. Your real analytics will
            appear here once you start using services.
          </p>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 p-6 rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Bookings</p>
              <h3 className="text-3xl font-bold text-white mt-2">
                {overview.totalBookings}
              </h3>
            </div>
            <Activity className="text-blue-400 w-8 h-8" />
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 p-6 rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Spent</p>
              <h3 className="text-3xl font-bold text-white mt-2">
                ৳{overview.totalSpent.toLocaleString()}
              </h3>
            </div>
            <DollarSign className="text-green-400 w-8 h-8" />
          </div>
        </div>

        {/* SOS Requests */}
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20 p-6 rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm">SOS Requests</p>
              <h3 className="text-3xl font-bold text-white mt-2">
                {overview.sosRequestsCount}
              </h3>
            </div>
            <AlertTriangle className="text-red-400 w-8 h-8" />
          </div>
        </div>

        {/* Vehicle Health */}
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 p-6 rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm">Vehicle Health</p>
              <h3 className={`text-3xl font-bold mt-2 ${healthStatus.color}`}>
                {overview.vehicleHealthScore}%
              </h3>
            </div>
            <TrendingUp className="text-purple-400 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Booking & Cost Trends */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-4">
            Service Usage & Spending Trends
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={bookingStats.byMonth}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#ffffff60" />
                <YAxis stroke="#ffffff60" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Bookings"
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Cost (৳)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Cost Distribution by Service */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-4">
            Spending by Service Type
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingStats.byServiceType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={(entry) => `${entry.name}`}
                >
                  {bookingStats.byServiceType.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => `৳${value.toLocaleString()}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Subscription Usage Progress */}
      {subscriptionUsage.tier !== "free" && (
        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/20 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">
                Subscription Usage
              </h3>
              <p className="text-white/60 text-sm mt-1">
                {subscriptionUsage.tier.charAt(0).toUpperCase() +
                  subscriptionUsage.tier.slice(1)}{" "}
                Plan • {subscriptionUsage.daysRemaining} days remaining
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-yellow-400">
                {subscriptionUsage.callsUsed}
                <span className="text-white/40">
                  /
                  {subscriptionUsage.callsLimit === -1
                    ? "∞"
                    : subscriptionUsage.callsLimit}
                </span>
              </span>
              <p className="text-yellow-400/60 text-xs uppercase tracking-wider mt-1">
                Service Calls
              </p>
            </div>
          </div>
          {subscriptionUsage.callsLimit !== -1 && (
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(
                    100,
                    (subscriptionUsage.callsUsed /
                      subscriptionUsage.callsLimit) *
                      100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Vehicle Health Score - Enhanced */}
      <div
        className={`bg-gradient-to-br ${
          healthScore >= 80
            ? "from-green-500/20 to-teal-500/10 border-green-500/20"
            : healthScore >= 60
            ? "from-blue-500/20 to-cyan-500/10 border-blue-500/20"
            : healthScore >= 40
            ? "from-yellow-500/20 to-orange-500/10 border-yellow-500/20"
            : "from-red-500/20 to-pink-500/10 border-red-500/20"
        } border p-6 rounded-2xl`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">
              Overall Vehicle Health
            </h3>
            <p className="text-white/60 text-sm mt-1">
              Based on recent service history & emergency requests
            </p>
          </div>
          <div className="text-right">
            <span className={`text-5xl font-bold ${healthStatus.color}`}>
              {healthScore}%
            </span>
            <p
              className={`${healthStatus.color} opacity-60 text-xs uppercase tracking-wider mt-1`}
            >
              {healthStatus.label}
            </p>
          </div>
        </div>
        <div className="w-full bg-white/10 h-3 rounded-full mt-6 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              healthScore >= 80
                ? "bg-green-500"
                : healthScore >= 60
                ? "bg-blue-500"
                : healthScore >= 40
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${healthScore}%` }}
          />
        </div>
      </div>

      {/* Booking Status Breakdown */}
      {Object.keys(bookingStats.byStatus).length > 0 && (
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-4">
            Booking Status Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(bookingStats.byStatus).map(([status, count]) => (
              <div
                key={status}
                className="bg-white/5 p-4 rounded-xl text-center"
              >
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-white/60 text-sm mt-1 capitalize">
                  {status.replace("_", " ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
