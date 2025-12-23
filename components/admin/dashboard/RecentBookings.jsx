"use client";

import { useEffect, useState } from "react";
import { MoreVertical, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import axios from "axios";
import Link from "next/link";

export default function RecentBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      // For admin, pass userId and role=admin
      const res = await axios.get(
        `/api/bookings?userId=${user._id}&role=admin`
      );
      if (res.data.success) {
        // Get only latest 5
        setBookings(res.data.bookings.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "accepted":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "pending":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusLabel = (status) => {
    if (status === "in_progress") return "In Progress";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="bg-[#121212] p-6 rounded-2xl border border-white/5 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Recent Bookings
          </h3>
          <p className="text-sm text-white/40">Latest service requests</p>
        </div>
        <Link
          href="/admin/bookings"
          className="text-[#FF532D] text-xs font-semibold hover:text-white transition-colors bg-[#FF532D]/10 hover:bg-[#FF532D] px-3 py-1.5 rounded-lg"
        >
          View All
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-white/40">No bookings found</p>
        </div>
      ) : (
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
                <tr
                  key={booking._id}
                  className="text-sm text-white/80 hover:bg-white/5 transition-colors group"
                >
                  <td className="py-4 font-mono text-white/40 pl-2 text-xs">
                    {booking._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/5 to-white/10 border border-white/5 flex items-center justify-center text-xs font-bold text-white">
                        {booking.user?.name?.[0] || "U"}
                      </div>
                      <span className="font-medium">
                        {booking.user?.name || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-white/50">
                    {booking.garage?.name || "N/A"}
                  </td>
                  <td className="py-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>
                  <td className="py-4 text-right pr-2">
                    <Link
                      href={`/admin/bookings/${booking._id}`}
                      className="text-white/20 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors inline-block"
                    >
                      <MoreVertical size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
