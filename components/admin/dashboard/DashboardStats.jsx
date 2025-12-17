"use client";

import { Users, Car, AlertTriangle, CalendarDays } from "lucide-react";

const stats = [
  {
    title: "Total Users",
    value: "1,234",
    description: "+12% from last month",
    icon: Users,
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Active Garages",
    value: "45",
    description: "+3 new this week",
    icon: Car,
    color: "bg-green-500/10 text-green-500",
  },
  {
    title: "Pending Requests",
    value: "8",
    description: "Needs attention",
    icon: AlertTriangle,
    color: "bg-orange-500/10 text-orange-500",
  },
  {
    title: "Total Bookings",
    value: "892",
    description: "+24% increase",
    icon: CalendarDays,
    color: "bg-purple-500/10 text-purple-500",
  },
];

export default function DashboardStats() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-[#121212] p-6 rounded-2xl border border-white/5 shadow-xl hover:shadow-2xl hover:border-[#FF532D]/30 transition-all duration-300 group relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color.replace('bg-', 'from-').split(' ')[0]}/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-medium text-white/60">{stat.title}</h3>
            <div className={`p-2.5 rounded-xl ${stat.color} bg-opacity-10`}>
              <stat.icon size={18} />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
            <div className="flex items-center gap-1 mt-2">
               <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                 {stat.description.split(" ")[0]}
               </span>
               <p className="text-xs text-white/30 truncate">{stat.description.substring(stat.description.indexOf(" "))}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
