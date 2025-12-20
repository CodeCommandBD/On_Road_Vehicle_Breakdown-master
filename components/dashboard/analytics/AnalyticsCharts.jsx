"use client";

import {
  BarChart,
  Bar,
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function AnalyticsCharts({ data }) {
  const { usage, costs, healthScore } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Service Usage Trends */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">
          Service Frequency (6 Months)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={usage}
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
              <Bar dataKey="services" fill="#8884d8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Cost Distribution */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">
          Spending Breakdown
        </h3>
        <div className="h-[300px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={costs}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {costs.map((entry, index) => (
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
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Vehicle Health Score */}
      <div className="bg-gradient-to-br from-green-500/20 to-teal-500/10 border border-green-500/20 p-6 rounded-2xl lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">
              Overall Vehicle Health
            </h3>
            <p className="text-white/60 text-sm mt-1">
              Based on recent AI Diagnoses & Service History
            </p>
          </div>
          <div className="text-right">
            <span className="text-5xl font-bold text-green-400">
              {healthScore}%
            </span>
            <p className="text-green-400/60 text-xs uppercase tracking-wider mt-1">
              Excellent Condition
            </p>
          </div>
        </div>
        <div className="w-full bg-white/10 h-3 rounded-full mt-6 overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${healthScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}
