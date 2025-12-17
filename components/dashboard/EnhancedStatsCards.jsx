"use client";

import { Activity, DollarSign, Award, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils/helpers";

export default function EnhancedStatsCards({ stats }) {
  const data = stats || {
    totalBookings: 0,
    totalSpent: 0,
    points: 0,
    activeRequests: 0,
  };

  const statItems = [
    {
      title: "Total Bookings",
      value: data.totalBookings,
      description: "All time services",
      icon: Activity,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
    },
    {
      title: "Total Spent",
      value: formatPrice(data.totalSpent),
      description: "Lifetime expenses",
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
    },
    {
      title: "Reward Points",
      value: data.points,
      description: "Cashback points",
      icon: Award,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "bg-gradient-to-br from-purple-500/20 to-pink-500/20",
    },
    {
      title: "Active Requests",
      value: data.activeRequests,
      description: "In progress now",
      icon: Clock,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "bg-gradient-to-br from-orange-500/20 to-red-500/20",
      pulse: data.activeRequests > 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className={`bg-[#1E1E1E] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 scale-hover fade-in ${
            stat.pulse ? "pulse-dot" : ""
          }`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Icon with gradient background */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div
              className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${stat.bgGradient}`}
            >
              <stat.icon
                className={`w-6 h-6 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                style={{
                  WebkitTextStroke: "1px transparent",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  fill: `url(#gradient-${index})`,
                }}
              />
              <svg width="0" height="0">
                <defs>
                  <linearGradient
                    id={`gradient-${index}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor={
                        stat.gradient.includes("blue")
                          ? "#3b82f6"
                          : stat.gradient.includes("green")
                          ? "#10b981"
                          : stat.gradient.includes("purple")
                          ? "#a855f7"
                          : "#f97316"
                      }
                    />
                    <stop
                      offset="100%"
                      stopColor={
                        stat.gradient.includes("cyan")
                          ? "#06b6d4"
                          : stat.gradient.includes("emerald")
                          ? "#059669"
                          : stat.gradient.includes("pink")
                          ? "#ec4899"
                          : "#ef4444"
                      }
                    />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Stats Content */}
          <div>
            <p className="text-xs sm:text-sm text-white/60 mb-1">
              {stat.title}
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {stat.value}
            </h3>
            <p className="text-xs text-white/50">{stat.description}</p>
          </div>

          {/* Progress indicator for active bookings */}
          {stat.pulse && data.activeRequests > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-white/60">Live updates</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
