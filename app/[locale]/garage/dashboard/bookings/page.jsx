"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import { Loader2, Filter, Search } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import BookingTable from "@/components/dashboard/BookingTable";

export default function BookingsPage() {
  const user = useSelector(selectUser);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [team, setTeam] = useState([]);

  // Fetch bookings from API
  const fetchBookings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await axios.get(
        `/api/bookings?userId=${user._id}&role=garage`
      );

      if (response.data.success) {
        setBookings(response.data.bookings);
        setFilteredBookings(response.data.bookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/garage/team");
      const data = await res.json();
      if (data.success) {
        setTeam(data.teamMembers);
      }
    } catch (error) {
      console.error("Error fetching team:", error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchTeam();
  }, [user]);

  // Filter bookings by status and search query
  useEffect(() => {
    let filtered = bookings;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Filter by search query (user name, booking number, service)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.user?.name?.toLowerCase().includes(query) ||
          b.bookingNumber?.toLowerCase().includes(query) ||
          b.service?.name?.toLowerCase().includes(query) ||
          b._id.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(filtered);
  }, [statusFilter, searchQuery, bookings]);

  // Handle booking status update
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const response = await axios.patch(`/api/bookings/${bookingId}/status`, {
        status: newStatus,
      });

      if (response.data.success) {
        toast.success(`Booking ${newStatus} successfully`);
        // Refresh bookings
        fetchBookings();
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update booking status"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  // Calculate stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    accepted: bookings.filter((b) => b.status === "accepted").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    canceled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manage Bookings</h1>
        <p className="text-white/60">
          View and manage all service requests from customers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <p className="text-white/60 text-sm">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4">
          <p className="text-yellow-400/80 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {stats.pending}
          </p>
        </div>
        <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4">
          <p className="text-blue-400/80 text-sm">Accepted</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {stats.accepted}
          </p>
        </div>
        <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-4">
          <p className="text-green-400/80 text-sm">Completed</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {stats.completed}
          </p>
        </div>
        <div className="bg-gray-500/10 backdrop-blur-sm border border-gray-500/30 rounded-xl p-4">
          <p className="text-gray-400/80 text-sm">Cancelled</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">
            {stats.canceled}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search by user, booking number, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-white/40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        <BookingTable
          type="garage"
          bookings={filteredBookings}
          onStatusUpdate={handleStatusUpdate}
          team={team}
        />
      </div>

      {/* Results count */}
      <div className="text-center text-white/40 text-sm">
        Showing {filteredBookings.length} of {bookings.length} bookings
      </div>
    </div>
  );
}
