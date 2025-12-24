"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Eye,
  MoreVertical,
  Calendar,
  MapPin,
  Wrench,
  Filter,
  Loader2,
  Trash2,
  XCircle,
  CheckCircle2,
  Clock,
  Navigation,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";

export default function BookingTable() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/admin/bookings");
      if (response.data.success) {
        setBookings(response.data.bookings);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus =
      statusFilter === "all" || booking.status === statusFilter;
    const matchesVehicle =
      vehicleFilter === "all" || booking.vehicleType === vehicleFilter;
    const matchesSearch =
      booking.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.garage?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesVehicle && matchesSearch;
  });

  const handleAction = async (type, bookingId, value) => {
    try {
      if (type === "delete") {
        if (!window.confirm("Are you sure you want to delete this booking?"))
          return;
        const resp = await axios.delete(
          `/api/admin/bookings?bookingId=${bookingId}`
        );
        if (resp.data.success) {
          toast.success("Booking deleted");
          fetchBookings();
        }
        return;
      }

      const payload = { bookingId, status: value };
      const response = await axios.put("/api/admin/bookings", payload);
      if (response.data.success) {
        toast.success(`Booking status updated to ${value}`);
        fetchBookings();
        setOpenDropdown(null);
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "pending":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "confirmed":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-white/5 text-white/40 border-white/10";
    }
  };

  const handleDropdownClick = (e, bookingId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setOpenDropdown(
      openDropdown?.id === bookingId
        ? null
        : {
            id: bookingId,
            x: rect.left - 180,
            y: rect.top + rect.height + 8,
          }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search ID, customer, garage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="all" className="bg-[#1A1A1A] text-white">
              All Status
            </option>
            <option value="pending" className="bg-[#1A1A1A] text-white">
              Pending
            </option>
            <option value="confirmed" className="bg-[#1A1A1A] text-white">
              Confirmed
            </option>
            <option value="in_progress" className="bg-[#1A1A1A] text-white">
              In Progress
            </option>
            <option value="completed" className="bg-[#1A1A1A] text-white">
              Completed
            </option>
            <option value="cancelled" className="bg-[#1A1A1A] text-white">
              Cancelled
            </option>
          </select>

          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="all" className="bg-[#1A1A1A] text-white">
              All Vehicles
            </option>
            <option value="car" className="bg-[#1A1A1A] text-white">
              Car
            </option>
            <option value="motorcycle" className="bg-[#1A1A1A] text-white">
              Motorcycle
            </option>
            <option value="bus" className="bg-[#1A1A1A] text-white">
              Bus
            </option>
            <option value="truck" className="bg-[#1A1A1A] text-white">
              Truck
            </option>
            <option value="cng" className="bg-[#1A1A1A] text-white">
              CNG
            </option>
            <option value="rickshaw" className="bg-[#1A1A1A] text-white">
              Rickshaw
            </option>
          </select>
        </div>

        <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
          {filteredBookings.length} Total Bookings
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">
              <tr>
                <th className="px-6 py-5">Booking ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Service Info</th>
                <th className="px-6 py-4 text-center">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Filter className="w-8 h-8" />
                      <p className="text-sm">
                        No bookings found matching your criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking._id}
                    className="hover:bg-white/[0.02] group transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-orange-500 font-bold">
                        #{booking.bookingNumber}
                      </div>
                      <div className="text-[10px] text-white/30 uppercase mt-1">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium text-sm">
                        {booking.user?.name || "Unknown"}
                      </div>
                      <div className="text-white/40 text-xs">
                        {booking.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-white text-sm font-medium flex items-center gap-1.5 capitalize">
                          <Wrench size={12} className="text-orange-500" />
                          {booking.service?.name || "Emergency Assistance"}
                        </span>
                        <span className="text-white/40 text-xs flex items-center gap-1.5">
                          <MapPin size={10} />
                          {booking.garage?.name || "Pending Assignment"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-white font-bold">
                        ৳{booking.actualCost || booking.estimatedCost || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(
                          booking.status
                        )}`}
                      >
                        {booking.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={(e) => handleDropdownClick(e, booking._id)}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                      >
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed Dropdown Menu */}
      {openDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpenDropdown(null)}
          />
          <div
            className="fixed z-50 w-56 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in duration-200"
            style={{ left: openDropdown.x, top: openDropdown.y }}
          >
            <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 mb-1">
              Update Status
            </div>

            {/* Tracking Button */}
            <Link
              href={`/admin/bookings/${openDropdown.id}/track`}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-orange-400 hover:bg-white/5 transition-colors"
            >
              <Navigation size={14} />
              Track Driver (Live)
            </Link>

            <div className="h-px bg-white/5 my-1" />

            <button
              onClick={() =>
                handleAction("update", openDropdown.id, "confirmed")
              }
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-purple-400 hover:bg-white/5 transition-colors"
            >
              <CheckCircle2 size={14} />
              Confirm Booking
            </button>

            <button
              onClick={() =>
                handleAction("update", openDropdown.id, "in_progress")
              }
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-blue-400 hover:bg-white/5 transition-colors"
            >
              <Clock size={14} />
              Set In Progress
            </button>

            <button
              onClick={() =>
                handleAction("update", openDropdown.id, "completed")
              }
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-green-400 hover:bg-white/5 transition-colors"
            >
              <CheckCircle2 size={14} />
              Complete Booking
            </button>

            <button
              onClick={() =>
                handleAction("update", openDropdown.id, "cancelled")
              }
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
            >
              <XCircle size={14} />
              Cancel Booking
            </button>

            <div className="h-px bg-white/5 my-1" />

            <button
              onClick={() => handleAction("delete", openDropdown.id)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
              Delete Permanently
            </button>
          </div>
        </>
      )}
    </div>
  );
}
