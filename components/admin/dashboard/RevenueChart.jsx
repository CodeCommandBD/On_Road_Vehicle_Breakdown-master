"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";
import axios from "axios";

export default function RevenueChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    fetchRevenueData();
  }, [period]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/admin/analytics/revenue?period=${period}`
      );
      if (res.data.success) {
        // Transform API data for chart
        const chartData = res.data.data.revenueByDay.map((item) => ({
          name: new Date(item._id).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          revenue: item.revenue,
          count: item.count,
        }));
        setData(chartData);
      }
    } catch (error) {
      console.error("Failed to fetch revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] p-6 rounded-2xl border border-white/5 h-[450px] shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Revenue Overview
          </h3>
          <p className="text-sm text-white/40">Monthly earnings performance</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-black/40 border border-white/10 text-white/70 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#FF532D] transition-colors cursor-pointer hover:bg-white/5"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last Year</option>
        </select>
      </div>

      {loading ? (
        <div className="h-[85%] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-[85%] flex items-center justify-center">
          <p className="text-white/40">No revenue data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF532D" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF532D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.5)"
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.5)"
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `৳${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111",
                borderColor: "rgba(255,255,255,0.1)",
                color: "#fff",
              }}
              itemStyle={{ color: "#fff" }}
              formatter={(value, name) => {
                if (name === "revenue") return [`৳${value}`, "Revenue"];
                if (name === "count") return [value, "Transactions"];
                return [value, name];
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#FF532D"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
