import { Activity, CreditCard, DollarSign, Users } from "lucide-react";
import { formatPrice } from "@/lib/utils/helpers";

export default function StatsCards({ stats }) {
  // Default values if no stats provided
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
      description: "Lifetime bookings",
      icon: Activity,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Total Value",
      value: formatPrice(data.totalSpent),
      description: "Revenue/Expense",
      icon: DollarSign,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Points / Rating",
      value: data.points || "4.5", // Fallback or different metric
      description: "Performance Score",
      icon: CreditCard,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Active Requests",
      value: data.activeRequests,
      description: "Currently in progress",
      icon: Users,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {statItems.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted">{stat.title}</h3>
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted mt-1">{stat.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
