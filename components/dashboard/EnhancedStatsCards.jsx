"use client";

import { Activity, DollarSign, Award, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils/helpers";
import { useTranslations } from "next-intl";

export default function EnhancedStatsCards({ stats }) {
  const t = useTranslations("Dashboard");
  const data = stats || {
    totalBookings: 0,
    totalSpent: 0,
    points: 0,
    activeRequests: 0,
  };

  const statItems = [
    {
      title: t("totalBookings"),
      value: data.totalBookings,
      description: t("allTime"),
      icon: Activity,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
    },
    {
      title: t("totalSpent"),
      value: formatPrice(data.totalSpent),
      description: t("lifetimeExpenses"),
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
    },
    {
      title: t("rewardPoints"),
      value: data.points,
      description: t("cashbackPoints"),
      icon: Award,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "bg-gradient-to-br from-purple-500/20 to-pink-500/20",
    },
    {
      title: t("activeRequests"),
      value: data.activeRequests,
      description: t("inProgressNow"),
      icon: Clock,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "bg-gradient-to-br from-orange-500/20 to-red-500/20",
      pulse: data.activeRequests > 0,
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-8 sm:mb-10">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className={`bg-[#1E1E1E] border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-6 scale-hover fade-in ${
            stat.pulse ? "pulse-dot" : ""
          }`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Icon with gradient background */}
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div
              className={`p-1.5 sm:p-3 rounded-lg sm:rounded-xl ${stat.bgGradient}`}
            >
              <stat.icon
                className={`w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
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
          <div className="min-w-0">
            <p className="text-[10px] sm:text-sm text-white/60 mb-0.5 sm:mb-1 truncate">
              {stat.title}
            </p>
            <h3 className="text-lg sm:text-3xl font-bold text-white mb-0.5 sm:mb-2 truncate">
              {stat.value}
            </h3>
            <p className="text-[9px] sm:text-xs text-white/50 truncate">
              {stat.description}
            </p>
          </div>

          {/* Progress indicator for active bookings */}
          {stat.pulse && data.activeRequests > 0 && (
            <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-white/10">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] sm:text-xs text-white/60 font-medium">
                  {t("liveUpdates")}
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
