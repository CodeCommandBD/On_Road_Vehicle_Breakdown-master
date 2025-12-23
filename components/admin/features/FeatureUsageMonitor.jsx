"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  TrendingUp,
  Users,
  Zap,
  Shield,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
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

export default function FeatureUsageMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/features/usage");
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch feature usage:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-white/60">No data available</p>
      </div>
    );
  }

  // Prepare chart data
  const tierData = [
    {
      name: "Free",
      users: data.tierDistribution.user.free || 0,
      garages: data.tierDistribution.garage.free || 0,
    },
    {
      name: "Trial",
      users: data.tierDistribution.user.trial || 0,
      garages: data.tierDistribution.garage.trial || 0,
    },
    {
      name: "Standard",
      users: data.tierDistribution.user.standard || 0,
      garages: data.tierDistribution.garage.standard || 0,
    },
    {
      name: "Premium",
      users: data.tierDistribution.user.premium || 0,
      garages: data.tierDistribution.garage.premium || 0,
    },
    {
      name: "Enterprise",
      users: data.tierDistribution.user.enterprise || 0,
      garages: data.tierDistribution.garage.enterprise || 0,
    },
  ];

  const adoptionData = Object.entries(data.adoptionRates).map(
    ([key, value]) => ({
      name: key.replace(/([A-Z])/g, " $1").trim(),
      rate: value,
    })
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="text-orange-500" />
          Feature Usage Monitor
        </h1>
        <p className="text-white/60 text-sm">
          Premium & Enterprise feature adoption tracking
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="text-blue-500" size={24} />
            </div>
          </div>
          <h3 className="text-white/60 text-sm mb-1">Total Users</h3>
          <p className="text-3xl font-bold text-white">
            {data.overview.totalUsers}
          </p>
          <p className="text-xs text-blue-500 mt-2">
            {data.overview.premiumUsers} Premium+
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Shield className="text-purple-500" size={24} />
            </div>
          </div>
          <h3 className="text-white/60 text-sm mb-1">Total Garages</h3>
          <p className="text-3xl font-bold text-white">
            {data.overview.totalGarages}
          </p>
          <p className="text-xs text-purple-500 mt-2">
            {data.overview.premiumGarages} Premium+
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="text-green-500" size={24} />
            </div>
          </div>
          <h3 className="text-white/60 text-sm mb-1">Top Feature</h3>
          <p className="text-xl font-bold text-white">
            {data.topFeatures[0]?.name || "N/A"}
          </p>
          <p className="text-xs text-green-500 mt-2">
            {data.topFeatures[0]?.usage || 0} users
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <BarChart3 className="text-orange-500" size={24} />
            </div>
          </div>
          <h3 className="text-white/60 text-sm mb-1">Avg Adoption</h3>
          <p className="text-3xl font-bold text-white">
            {Math.round(
              Object.values(data.adoptionRates).reduce((a, b) => a + b, 0) /
                Object.keys(data.adoptionRates).length
            ) || 0}
            %
          </p>
          <p className="text-xs text-orange-500 mt-2">Across all features</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Tier Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tierData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" tick={{ fill: "#888" }} />
              <YAxis stroke="#888" tick={{ fill: "#888" }} />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar dataKey="users" fill="#4ECDC4" radius={[8, 8, 0, 0]} />
              <Bar dataKey="garages" fill="#FF6B6B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Adoption Rates */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Feature Adoption Rate
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={adoptionData}
                dataKey="rate"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.name}: ${entry.rate}%`}
              >
                {adoptionData.map((entry, index) => (
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

      {/* Feature Usage Table */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Feature Usage Details
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-wider border-b border-white/10">
                <th className="pb-4 font-medium">Feature</th>
                <th className="pb-4 font-medium text-right">Premium Users</th>
                <th className="pb-4 font-medium text-right">
                  Enterprise Users
                </th>
                <th className="pb-4 font-medium text-right">Total</th>
                <th className="pb-4 font-medium text-right">Adoption Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {Object.entries(data.featureUsage).map(([feature, usage]) => (
                <tr
                  key={feature}
                  className="text-sm text-white/80 hover:bg-white/5"
                >
                  <td className="py-4 font-medium text-white capitalize">
                    {feature.replace(/([A-Z])/g, " $1").trim()}
                  </td>
                  <td className="py-4 text-right text-blue-400">
                    {usage.premium}
                  </td>
                  <td className="py-4 text-right text-purple-400">
                    {usage.enterprise}
                  </td>
                  <td className="py-4 text-right text-white font-bold">
                    {usage.total}
                  </td>
                  <td className="py-4 text-right">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-bold ${
                        data.adoptionRates[feature] >= 50
                          ? "bg-green-500/20 text-green-400"
                          : data.adoptionRates[feature] >= 25
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {data.adoptionRates[feature] || 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Limits Reference */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Feature Limits by Tier
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(data.featureLimits).map(([feature, limits]) => (
            <div key={feature} className="bg-white/5 rounded-xl p-4">
              <h4 className="text-white font-semibold mb-3 capitalize">
                {feature.replace(/([A-Z])/g, " $1").trim()}
              </h4>
              <div className="space-y-2 text-sm">
                {Object.entries(limits).map(([tier, limit]) => (
                  <div key={tier} className="flex justify-between">
                    <span className="text-white/60 capitalize">{tier}:</span>
                    <span className="text-white font-medium">
                      {limit === -1 ? "Unlimited" : limit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
