"use client";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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

/**
 * Reusable Line Chart Component
 */
export function RevenueLineChart({
  data,
  dataKey = "value",
  color = "#3B82F6",
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: "12px" }} />
        <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#F3F4F6",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Reusable Area Chart Component
 */
export function RevenueAreaChart({
  data,
  dataKey = "value",
  color = "#3B82F6",
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: "12px" }} />
        <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#F3F4F6",
          }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#color${dataKey})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * Reusable Bar Chart Component
 */
export function RevenueBarChart({
  data,
  dataKey = "value",
  color = "#3B82F6",
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: "12px" }} />
        <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#F3F4F6",
          }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Reusable Pie Chart Component
 */
export function RevenuePieChart({ data }) {
  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#F3F4F6",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Funnel Chart Component
 */
export function FunnelChart({ data }) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-2">
      {data.map((step, index) => {
        const percentage = (step.value / maxValue) * 100;
        const dropOff =
          index > 0
            ? ((data[index - 1].value - step.value) / data[index - 1].value) *
              100
            : 0;

        return (
          <div key={index} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">
                {step.name}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  {step.value.toLocaleString()}
                </span>
                {index > 0 && dropOff > 0 && (
                  <span className="text-xs text-red-400">
                    -{dropOff.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-12 bg-gray-800 rounded-lg overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 flex items-center justify-center"
                style={{ width: `${percentage}%` }}
              >
                <span className="text-white font-bold text-sm">
                  {((step.value / data[0].value) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Stat Card Component
 */
export function StatCard({ title, value, change, icon: Icon, color = "blue" }) {
  const colorClasses = {
    blue: "from-blue-600 to-blue-700",
    green: "from-green-600 to-green-700",
    orange: "from-orange-600 to-orange-700",
    purple: "from-purple-600 to-purple-700",
    red: "from-red-600 to-red-700",
  };

  const isPositive = change >= 0;

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold ${
              isPositive ? "text-green-500" : "text-red-500"
            }`}
          >
            {isPositive ? "↗" : "↘"} {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
