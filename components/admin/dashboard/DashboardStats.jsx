"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  AlertTriangle,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import axios from "axios";

export default function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/admin/counts");
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#121212] p-6 rounded-2xl border border-white/5 animate-pulse"
          >
            <div className="h-24"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Users",
      value: stats.users.total.toLocaleString(),
      description: `${stats.users.newThisMonth} new this month`,
      growth: stats.users.growth,
      icon: Users,
      color: "bg-blue-500/10 text-blue-500",
      gradient: "from-blue-500",
    },
    {
      title: "Active Garages",
      value: stats.garages.total.toLocaleString(),
      description: `${stats.garages.verified} verified`,
      growth: stats.garages.growth,
      icon: Building2,
      color: "bg-green-500/10 text-green-500",
      gradient: "from-green-500",
    },
    {
      title: "Pending Requests",
      value: stats.bookings.pending,
      description:
        stats.sos.active > 0
          ? `${stats.sos.active} SOS active`
          : "No active SOS",
      growth: null,
      icon: AlertTriangle,
      color: "bg-orange-500/10 text-orange-500",
      gradient: "from-orange-500",
      alert: stats.bookings.pending > 0 || stats.sos.active > 0,
    },
    {
      title: "Total Bookings",
      value: stats.bookings.total.toLocaleString(),
      description: `${stats.bookings.thisMonth} this month`,
      growth: stats.bookings.growth,
      icon: CalendarDays,
      color: "bg-purple-500/10 text-purple-500",
      gradient: "from-purple-500",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-[#121212] p-6 rounded-2xl border border-white/5 shadow-xl hover:shadow-2xl hover:border-[#FF532D]/30 transition-all duration-300 group relative overflow-hidden"
        >
          {/* Background Gradient */}
          <div
            className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient}/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}
          ></div>

          {/* Alert Indicator */}
          {stat.alert && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}

          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-medium text-white/60">{stat.title}</h3>
            <div className={`p-2.5 rounded-xl ${stat.color} bg-opacity-10`}>
              <stat.icon size={18} />
            </div>
          </div>

          <div className="relative z-10">
            <div className="text-3xl font-bold text-white tracking-tight">
              {stat.value}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {stat.growth !== null && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                    stat.growth >= 0
                      ? "text-green-400 bg-green-400/10"
                      : "text-red-400 bg-red-400/10"
                  }`}
                >
                  {stat.growth >= 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {Math.abs(stat.growth)}%
                </span>
              )}
              <p className="text-xs text-white/40">{stat.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
