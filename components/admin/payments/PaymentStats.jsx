"use client";

import { DollarSign, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

const stats = [
  {
    title: "Total Revenue",
    value: "৳1,24,500",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "bg-green-500/10 text-green-500",
  },
  {
    title: "Platform Fees",
    value: "৳18,675",
    change: "+8.2%",
    trend: "up",
    icon: Wallet,
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Subscription Income",
    value: "৳45,000",
    change: "+15.3%",
    trend: "up",
    icon: ArrowUpRight,
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    title: "Pending Payouts",
    value: "৳2,400",
    change: "-2.1%",
    trend: "down",
    icon: ArrowDownRight,
    color: "bg-orange-500/10 text-orange-500",
  },
];

export default function PaymentStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-[#1E1E1E] p-6 rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/60 font-medium text-sm">{stat.title}</h3>
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                stat.trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {stat.change}
              </span>
              <span className="text-xs text-white/40">vs last month</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
