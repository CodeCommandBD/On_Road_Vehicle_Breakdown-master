"use client";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import axiosInstance from "@/lib/axios";
import { toast } from "react-toastify";
import {
  TrendingUp,
  Star,
  Clock,
  Users,
  DollarSign,
  Award,
  Target,
  AlertCircle,
} from "lucide-react";
import {
  RevenueLineChart,
  RevenueBarChart,
  StatCard,
} from "@/components/analytics/Charts";
import { format } from "date-fns";

export default function GarageAnalyticsPage() {
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    if (user?.garageId) {
      fetchPerformance();
    }
  }, [user]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/analytics/garage-performance?garageId=${user.garageId}&period=monthly`,
      );
      setPerformance(res.data.performance);
    } catch (error) {
      console.error("Performance fetch error:", error);
      toast.error("Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your performance...</p>
        </div>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="p-6">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            No Data Available
          </h2>
          <p className="text-gray-400">
            Performance data will be available once you have bookings.
          </p>
        </div>
      </div>
    );
  }

  const score = performance.performanceScore?.overall || 0;
  const bookings = performance.bookings || {};
  const revenue = performance.revenue || {};
  const satisfaction = performance.satisfaction || {};
  const ranking = performance.ranking || {};
  const competitive = performance.competitive || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with Performance Score */}
      <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-white mb-2">
              Your Performance
            </h1>
            <p className="text-gray-400">Track your garage's success metrics</p>
          </div>

          <div className="text-center">
            <div className="relative inline-block">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#374151"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(score / 100) * 352} 352`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{score}</span>
                <span className="text-sm text-gray-400">Score</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              Rank #{ranking.overall || "N/A"} of {ranking.totalGarages || 0}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bookings"
          value={bookings.total?.toLocaleString() || 0}
          change={bookings.growth || 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Revenue"
          value={`৳${revenue.total?.toLocaleString() || 0}`}
          change={revenue.growth || 0}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Rating"
          value={`${satisfaction.rating || 0} ⭐`}
          change={0}
          icon={Star}
          color="orange"
        />
        <StatCard
          title="Completion Rate"
          value={`${bookings.completionRate || 0}%`}
          change={0}
          icon={Target}
          color="purple"
        />
      </div>

      {/* Performance Breakdown */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          Performance Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Bookings",
              value: performance.performanceScore?.breakdown?.bookings || 0,
              max: 30,
            },
            {
              label: "Revenue",
              value: performance.performanceScore?.breakdown?.revenue || 0,
              max: 25,
            },
            {
              label: "Satisfaction",
              value: performance.performanceScore?.breakdown?.satisfaction || 0,
              max: 25,
            },
            {
              label: "Efficiency",
              value: performance.performanceScore?.breakdown?.efficiency || 0,
              max: 20,
            },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-sm text-gray-400 mb-2">{item.label}</p>
              <div className="relative w-24 h-24 mx-auto mb-2">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#374151"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#3B82F6"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${(item.value / item.max) * 251} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {item.value}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500">out of {item.max}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Stats */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Booking Statistics
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Completed</span>
              <span className="text-white font-bold">
                {bookings.completed || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Pending</span>
              <span className="text-yellow-500 font-bold">
                {bookings.pending || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Cancelled</span>
              <span className="text-red-500 font-bold">
                {bookings.cancelled || 0}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Completion Rate</span>
                <span className="text-green-500 font-bold">
                  {bookings.completionRate || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Satisfaction */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Customer Satisfaction
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Average Rating</span>
              <span className="text-yellow-500 font-bold">
                ★ {satisfaction.rating || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Reviews</span>
              <span className="text-white font-bold">
                {satisfaction.reviewCount || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Response Time</span>
              <span className="text-white font-bold">
                {satisfaction.responseTime || 0} min
              </span>
            </div>
            <div className="pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Repeat Customers</span>
                <span className="text-blue-500 font-bold">
                  {satisfaction.repeatCustomers || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Position */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Competitive Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-700/30 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Your Position</p>
            <p className="text-2xl font-bold text-white capitalize">
              {competitive.position?.replace("_", " ") || "Average"}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-700/30 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Industry Avg Score</p>
            <p className="text-2xl font-bold text-white">
              {competitive.avgIndustry?.performanceScore || 70}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-700/30 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Industry Avg Rating</p>
            <p className="text-2xl font-bold text-yellow-500">
              ★ {competitive.avgIndustry?.rating || 4.0}
            </p>
          </div>
        </div>
      </div>

      {/* Improvement Opportunities */}
      {performance.improvements && performance.improvements.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Improvement Opportunities
          </h2>
          <div className="space-y-3">
            {performance.improvements.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    item.priority === "high"
                      ? "bg-red-500/20 text-red-500"
                      : item.priority === "medium"
                        ? "bg-orange-500/20 text-orange-500"
                        : "bg-gray-500/20 text-gray-500"
                  }`}
                >
                  {item.priority}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{item.area}</p>
                  <p className="text-sm text-gray-400">{item.suggestion}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {item.current} → Target: {item.target}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
