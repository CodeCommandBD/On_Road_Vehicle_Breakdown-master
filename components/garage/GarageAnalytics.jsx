"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import axios from "axios";
import {
  TrendingUp,
  DollarSign,
  Star,
  CheckCircle,
  Loader2,
  Lock,
} from "lucide-react";
import {
  LineChart,
  Line,
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
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function GarageAnalytics() {
  const t = useTranslations("Subscription");
  const user = useSelector(selectUser);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState(30);

  const isPremium =
    (user?.garage?.membershipTier === "premium" ||
      user?.garage?.membershipTier === "enterprise" ||
      user?.garage?.membershipTier === "professional") &&
    (!user?.garage?.membershipExpiry ||
      new Date(user.garage.membershipExpiry) > new Date());

  useEffect(() => {
    if (isPremium && user?.garage?._id) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [timeFilter, user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/garage/analytics?garageId=${user.garage._id}&days=${timeFilter}`
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

  const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];

  // Premium-only content gate
  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
        <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mb-6">
          <Lock className="text-orange-500" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {t("lockedTitle")}
        </h2>
        <p className="text-white/60 text-center mb-6 max-w-md">
          {t("lockedDesc")}
        </p>
        <Link
          href="/garage/dashboard/subscription"
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-colors"
        >
          {t("upgradePremium")}
        </Link>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-white/60 text-sm">{analytics.overview.period}</p>
        </div>

        {/* Time Filter */}
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(parseInt(e.target.value))}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
        >
          <option value={7} className="bg-[#1A1A1A] text-white">
            Last 7 Days
          </option>
          <option value={30} className="bg-[#1A1A1A] text-white">
            Last 30 Days
          </option>
          <option value={90} className="bg-[#1A1A1A] text-white">
            Last 90 Days
          </option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="text-blue-500" size={24} />
            </div>
          </div>
          <h3 className="text-white/60 text-sm mb-1">Total Bookings</h3>
          <p className="text-3xl font-bold text-white">
            {analytics.overview.totalBookings}
          </p>
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
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Star className="text-yellow-500" size={24} />
            </div>
          </div>
          <h3 className="text-white/60 text-sm mb-1">Avg Rating</h3>
          <p className="text-3xl font-bold text-white">
            {analytics.overview.avgRating} ⭐
          </p>
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
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.charts.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="date"
                stroke="#888"
                tick={{ fill: "#888", fontSize: 10 }}
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
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#FF6B6B"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Service Popularity */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top Services</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.charts.servicePopularity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="name"
                stroke="#888"
                tick={{ fill: "#888", fontSize: 10 }}
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
              <Bar dataKey="revenue" fill="#4ECDC4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Distribution & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Booking Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics.charts.statusDistribution}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {analytics.charts.statusDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Peak Hours</h3>
          <div className="space-y-3">
            {analytics.charts.peakHours.map((ph, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-white/80">
                  {ph.hour}:00 - {ph.hour + 1}:00
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (ph.count / analytics.charts.peakHours[0].count) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-white font-bold w-8">{ph.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
