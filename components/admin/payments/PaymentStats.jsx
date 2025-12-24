"use client";

import { DollarSign, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function PaymentStats({ stats }) {
  // Safe default
  const safeStats = stats || { revenue: 0, payouts: 0, net: 0, count: 0 };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statItems = [
    {
      title: "Total Revenue",
      value: formatCurrency(safeStats.revenue),
      // change: "+12.5%", // We might not have historical data for change yet
      // trend: "up",
      icon: DollarSign,
      color: "bg-green-500/10 text-green-500",
      desc: "Total incoming payments",
    },
    {
      title: "Total Payouts",
      value: formatCurrency(safeStats.payouts),
      // change: "+8.2%",
      // trend: "up",
      icon: Wallet,
      color: "bg-blue-500/10 text-blue-500",
      desc: "Total outgoing payments",
    },
    {
      title: "Net Profit",
      value: formatCurrency(safeStats.net),
      // change: "+15.3%",
      // trend: "up",
      icon: ArrowUpRight,
      color: "bg-purple-500/10 text-purple-500",
      desc: "Revenue minus payouts",
    },
    {
      title: "Total Transactions",
      value: safeStats.count,
      // change: "-2.1%",
      // trend: "down",
      icon: ArrowDownRight,
      color: "bg-orange-500/10 text-orange-500",
      desc: "All time volume",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className="bg-[#1E1E1E] p-6 rounded-xl border border-white/5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/60 font-medium text-sm">{stat.title}</h3>
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-white/40">{stat.desc}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
