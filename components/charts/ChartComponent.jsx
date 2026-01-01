"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

export default function ChartComponent({
  type = "bar",
  data = [],
  dataKey = "value",
  categoryKey = "name",
  color = "#3b82f6",
  height = 300,
}) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg text-gray-500"
        style={{ height }}
      >
        No data available to display
      </div>
    );
  }

  const Chart = type === "line" ? LineChart : BarChart;
  const DataComponent = type === "line" ? Line : Bar;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <Chart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={categoryKey}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend />
          <DataComponent
            type="monotone"
            dataKey={dataKey}
            fill={color}
            stroke={color}
            radius={type === "bar" ? [4, 4, 0, 0] : undefined}
            strokeWidth={2}
          />
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
