import { Activity, CreditCard, DollarSign, Users } from "lucide-react";
import { formatPrice } from "@/lib/utils/helpers";
import { useTranslations } from "next-intl";

export default function StatsCards({ stats }) {
  const t = useTranslations("Dashboard");
  // Default values if no stats provided
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
      description: t("lifetimeBookings"),
      icon: Activity,
      color: "bg-blue-100/10 text-blue-400 border-blue-100/20",
    },
    {
      title: "Total Value",
      value: formatPrice(data.totalSpent),
      description: t("revenueExpense"),
      icon: DollarSign,
      color: "bg-green-100/10 text-green-400 border-green-100/20",
    },
    {
      title: t("rewardPoints"),
      value: data.points || "4.5",
      description: t("performanceScore"),
      icon: CreditCard,
      color: "bg-purple-100/10 text-purple-400 border-purple-100/20",
    },
    {
      title: t("activeRequests"),
      value: data.activeRequests,
      description: t("currentlyProgress"),
      icon: Users,
      color: "bg-orange-100/10 text-orange-400 border-orange-100/20",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className="bg-[#1E1E1E] p-6 rounded-xl border border-white/10 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/60">{stat.title}</h3>
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <p className="text-xs text-white/40 mt-1">{stat.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
