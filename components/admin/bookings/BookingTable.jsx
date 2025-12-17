"use client";

import { useState } from "react";
import { Search, Eye, MoreHorizontal, Calendar, MapPin, Wrench } from "lucide-react";

// Mock Data
const mockBookings = [
  { 
    id: "BK-2458", 
    customer: "Rahim Uddin", 
    garage: "Master Fix Auto", 
    service: "Hybrid Battery Fix",
    status: "In Progress", 
    date: "16 Dec 2024",
    amount: "৳8,500",
    location: "Tejgaon, Dhaka"
  },
  { 
    id: "BK-2457", 
    customer: "Karim Hasan", 
    garage: "Speedy Motors", 
    service: "Tire Change",
    status: "Pending", 
    date: "16 Dec 2024",
    amount: "৳500",
    location: "Banani, Dhaka"
  },
  { 
    id: "BK-2456", 
    customer: "Alice Smith", 
    garage: "Dhaka Wheels", 
    service: "Car Wash",
    status: "Completed", 
    date: "15 Dec 2024",
    amount: "৳1,200",
    location: "Mirpur 10, Dhaka"
  },
  { 
    id: "BK-2455", 
    customer: "Bob Wilson", 
    garage: "Master Fix Auto", 
    service: "Oil Change",
    status: "Cancelled", 
    date: "14 Dec 2024",
    amount: "৳3,000",
    location: "Gulshan 1, Dhaka"
  },
];

export default function BookingTable() {
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBookings = mockBookings.filter(booking => {
    const matchesFilter = filter === "All" || booking.status === filter;
    const matchesSearch = booking.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "In Progress": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Pending": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "Cancelled": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Status Filters */}
        <div className="flex bg-[#1E1E1E] p-1 rounded-lg border border-white/10 w-fit">
          {['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === status 
                  ? "bg-white/10 text-white shadow-sm" 
                  : "text-white/60 hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
          <input
            type="text"
            placeholder="Search booking ID or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#1E1E1E] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#FF532D] w-full sm:w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1E1E1E] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-white/60 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Booking ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Service Info</th>
                <th className="px-6 py-4">Date & Location</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBookings.length === 0 ? (
                 <tr><td colSpan="7" className="px-6 py-8 text-center text-white/40">No bookings found.</td></tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-white/80 text-sm">{booking.id}</td>
                    <td className="px-6 py-4 text-white font-medium">{booking.customer}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-white text-sm flex items-center gap-1.5"><Wrench size={12} className="text-[#FF532D]" /> {booking.service}</span>
                        <span className="text-white/40 text-xs">{booking.garage}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-white/80 text-xs flex items-center gap-1.5"><Calendar size={12} /> {booking.date}</span>
                        <span className="text-white/40 text-xs flex items-center gap-1.5"><MapPin size={12} /> {booking.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-bold">{booking.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
