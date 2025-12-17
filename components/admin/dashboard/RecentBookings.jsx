"use client";

import { MoreVertical } from "lucide-react";

export default function RecentBookings() {
  const bookings = [
    { id: "BK001", user: "John Doe", garage: "FixIt Hub", status: "In Progress", date: "2 mins ago" },
    { id: "BK002", user: "Alice Smith", garage: "Moto Care", status: "Completed", date: "1 hour ago" },
    { id: "BK003", user: "Bob Wilson", garage: "Speedy Fix", status: "Pending", date: "3 hours ago" },
    { id: "BK004", user: "Sarah Jones", garage: "Auto Pro", status: "Cancelled", date: "Yesterday" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-500/10 text-green-500";
      case "In Progress": return "bg-blue-500/10 text-blue-500";
      case "Pending": return "bg-orange-500/10 text-orange-500";
      case "Cancelled": return "bg-red-500/10 text-red-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="bg-[#121212] p-6 rounded-2xl border border-white/5 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
           <h3 className="text-lg font-bold text-white tracking-tight">Recent Bookings</h3>
           <p className="text-sm text-white/40">Latest service requests</p>
        </div>
        <button className="text-[#FF532D] text-xs font-semibold hover:text-white transition-colors bg-[#FF532D]/10 hover:bg-[#FF532D] px-3 py-1.5 rounded-lg">View All</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-white/30 text-xs uppercase tracking-wider border-b border-white/5">
              <th className="pb-4 font-medium pl-2">ID</th>
              <th className="pb-4 font-medium">User</th>
              <th className="pb-4 font-medium">Garage</th>
              <th className="pb-4 font-medium">Status</th>
              <th className="pb-4 font-medium text-right pr-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {bookings.map((booking) => (
              <tr key={booking.id} className="text-sm text-white/80 hover:bg-white/5 transition-colors group">
                <td className="py-4 font-mono text-white/40 pl-2">{booking.id}</td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/5 to-white/10 border border-white/5 flex items-center justify-center text-xs font-bold text-white">
                      {booking.user[0]}
                    </div>
                    <span className="font-medium">{booking.user}</span>
                  </div>
                </td>
                <td className="py-4 text-white/50">{booking.garage}</td>
                <td className="py-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(booking.status).replace('bg-','border-').replace('10', '20')} ${getStatusColor(booking.status)} bg-opacity-10`}>
                    {booking.status}
                  </span>
                </td>
                <td className="py-4 text-right pr-2">
                  <button className="text-white/20 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
