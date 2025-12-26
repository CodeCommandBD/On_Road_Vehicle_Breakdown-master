"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import BookingTable from "@/components/dashboard/BookingTable";
import {
  Calendar,
  Search,
  Filter,
  Loader2,
  Plus,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";

export default function MyBookingsPage() {
  const user = useSelector(selectUser);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState("table"); // table or grid
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?._id) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings?userId=${user._id}&role=user`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Fetch bookings error:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = filterStatus === "all" || b.status === filterStatus;
    const matchesSearch =
      b.garage?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Booking ${newStatus} successfully`);
        fetchBookings(); // Refresh list
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-orange-500" />
            My Bookings
          </h1>
          <p className="text-white/60 mt-1">
            Track and manage your vehicle service requests
          </p>
        </div>
        <Link
          href="/book"
          className="btn btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold shadow-glow-orange shrink-0"
        >
          <Plus className="w-5 h-5" />
          New Booking
        </Link>
      </div>

      {/* Filters & Search Section */}
      <div className="bg-[#1E1E1E] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by garage or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-white/40" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none min-w-[140px]"
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
            <option value="in-progress" className="bg-[#1A1A1A] text-white">
              In Progress
            </option>
            <option value="completed" className="bg-[#1A1A1A] text-white">
              Completed
            </option>
            <option value="cancelled" className="bg-[#1A1A1A] text-white">
              Cancelled
            </option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="hidden md:flex bg-white/5 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => setViewType("table")}
            className={`p-2 rounded-lg transition-all ${
              viewType === "table"
                ? "bg-orange-500 text-white"
                : "text-white/40 hover:text-white"
            }`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewType("grid")}
            className={`p-2 rounded-lg transition-all ${
              viewType === "grid"
                ? "bg-orange-500 text-white"
                : "text-white/40 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-[#1E1E1E] border border-white/10 rounded-2xl">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
          <p className="text-white/60">Loading your bookings...</p>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {viewType === "table" ? (
            <BookingTable
              type="user"
              bookings={filteredBookings}
              onStatusUpdate={handleStatusUpdate}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {/* Grid View implementation if needed, but for now BookingTable is enough */}
              <p className="col-span-full text-center text-white/40 italic">
                Grid view coming soon. Switching back to table.
              </p>
              <BookingTable
                type="user"
                bookings={filteredBookings}
                onStatusUpdate={handleStatusUpdate}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-[#1E1E1E] border border-2 border-dashed border-white/10 rounded-3xl text-center">
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            No Bookings Found
          </h2>
          <p className="text-white/60 max-w-sm mb-8">
            {searchQuery || filterStatus !== "all"
              ? "We couldn't find any bookings matching your current filters. Try resetting them."
              : "You haven't made any bookings yet. Need help with your vehicle? Book a service now!"}
          </p>
          {!searchQuery && filterStatus === "all" && (
            <Link
              href="/book"
              className="btn btn-primary px-8 py-3 rounded-xl font-bold shadow-glow-orange"
            >
              Book a Service
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
