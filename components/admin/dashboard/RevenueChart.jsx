"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', revenue: 4000, bookings: 240 },
  { name: 'Feb', revenue: 3000, bookings: 139 },
  { name: 'Mar', revenue: 2000, bookings: 980 },
  { name: 'Apr', revenue: 2780, bookings: 390 },
  { name: 'May', revenue: 1890, bookings: 480 },
  { name: 'Jun', revenue: 2390, bookings: 380 },
  { name: 'Jul', revenue: 3490, bookings: 430 },
];

export default function RevenueChart() {
  return (
    <div className="bg-[#121212] p-6 rounded-2xl border border-white/5 h-[450px] shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
           <h3 className="text-lg font-bold text-white tracking-tight">Revenue Overview</h3>
           <p className="text-sm text-white/40">Monthly earnings performance</p>
        </div>
        <select className="bg-black/40 border border-white/10 text-white/70 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#FF532D] transition-colors cursor-pointer hover:bg-white/5">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>Last Year</option>
        </select>
      </div>
      
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF532D" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#FF532D" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="rgba(255,255,255,0.5)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.5)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `৳${value}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
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
    </div>
  );
}
