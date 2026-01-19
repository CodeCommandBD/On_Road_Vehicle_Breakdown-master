"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Activity,
  Crown,
  Clock,
} from "lucide-react";
import axiosInstance from "@/lib/axios";

export default function SubscriptionStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axiosInstance.get("/admin/subscriptions/stats");
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse"
          >
            <div className="h-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: "Total Active Subscriptions",
      value: stats.overview.totalActiveSubscriptions,
      icon: Crown,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      subText: `${stats.overview.activeUserSubscriptions} Users, ${stats.overview.activeGarageSubscriptions} Garages`,
    },
    {
      title: "Monthly Revenue (MRR)",
      value: `৳${stats.revenue.mrr.toLocaleString()}`,
      icon: DollarSign,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      subText: `Total: ৳${stats.revenue.total.toLocaleString()}`,
    },
    {
      title: "Expiring Soon",
      value: stats.overview.expiringSoon,
      icon: Clock,
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      subText: "Within 7 days",
      alert: stats.overview.expiringSoon > 10,
    },
    {
      title: "Expired Subscriptions",
      value: stats.overview.expired,
      icon: AlertCircle,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      subText: "Need attention",
      alert: stats.overview.expired > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="text-orange-500" size={24} />
            Subscription Analytics
          </h2>
          <p className="text-white/60 text-sm">
            Real-time subscription metrics
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`relative bg-white/5 border ${card.borderColor} rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-4px] ${card.bgColor}`}
          >
            {/* Alert Badge */}
            {card.alert && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            )}

            {/* Icon */}
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-lg`}
            >
              <card.icon className="text-white" size={24} />
            </div>

            {/* Content */}
            <div>
              <p className="text-white/60 text-sm font-medium mb-1">
                {card.title}
              </p>
              <h3 className="text-3xl font-bold text-white mb-2">
                {card.value}
              </h3>
              <p className="text-white/40 text-xs">{card.subText}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tier Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Tier Breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-blue-500" size={20} />
            <h3 className="text-lg font-bold text-white">
              User Subscriptions by Tier
            </h3>
          </div>
          <div className="space-y-3">
            {stats.breakdown.users.map((tier, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-white/80 text-sm capitalize">
                  {tier._id || "Free"}
                </span>
                <span className="text-white font-bold">{tier.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Garage Tier Breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="text-purple-500" size={20} />
            <h3 className="text-lg font-bold text-white">
              Garage Subscriptions by Tier
            </h3>
          </div>
          <div className="space-y-3">
            {stats.breakdown.garages.map((tier, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-white/80 text-sm capitalize">
                  {tier._id || "Free"}
                </span>
                <span className="text-white font-bold">{tier.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
