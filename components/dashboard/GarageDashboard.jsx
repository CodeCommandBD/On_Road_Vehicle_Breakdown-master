import { useEffect, useState } from "react";
import StatsCards from "@/components/dashboard/StatsCards";
import BookingTable from "@/components/dashboard/BookingTable";
import RevenueChart from "@/components/dashboard/RevenueChart";
import { Plus, Loader2, MapPin, Star, CheckCircle, Crown } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";

export default function GarageDashboard({ user }) {
  const [bookings, setBookings] = useState([]);
  const [garageProfile, setGarageProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    monthlyRevenue: 0,
    rating: 0,
    activeRequests: 0,
    completedToday: 0,
    successRate: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Fetch garage profile and bookings in parallel
        const [garageRes, bookingsRes] = await Promise.all([
          axios.get("/api/garages/profile"),
          axios.get(`/api/bookings?userId=${user._id}&role=garage`),
        ]);

        if (garageRes.data.success) {
          setGarageProfile(garageRes.data.garage);
        }

        if (bookingsRes.data.success) {
          const fetchedBookings = bookingsRes.data.bookings;
          setBookings(fetchedBookings);

          // Calculate Stats
          const totalBookings = fetchedBookings.length;
          const activeRequests = fetchedBookings.filter(
            (b) => b.status === "pending" || b.status === "accepted"
          ).length;

          // Monthly revenue (current month)
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const monthlyRevenue = fetchedBookings
            .filter((b) => {
              const bookingDate = new Date(b.createdAt);
              return (
                b.status === "completed" &&
                bookingDate.getMonth() === currentMonth &&
                bookingDate.getFullYear() === currentYear
              );
            })
            .reduce((sum, b) => sum + (b.estimatedCost || 0), 0);

          // Completed today
          const today = new Date().setHours(0, 0, 0, 0);
          const completedToday = fetchedBookings.filter((b) => {
            const completedDate = new Date(b.updatedAt).setHours(0, 0, 0, 0);
            return b.status === "completed" && completedDate === today;
          }).length;

          // Success rate
          const completedBookings = fetchedBookings.filter(
            (b) => b.status === "completed"
          ).length;
          const successRate =
            totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

          setStats({
            totalBookings,
            monthlyRevenue,
            rating: garageRes.data.garage?.rating?.average || 0,
            activeRequests,
            completedToday,
            successRate,
          });
        }
      } catch (error) {
        console.error("Dashboard Error:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Garage Info */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">
              {garageProfile?.name || "Garage Overview"}
            </h1>
            {garageProfile?.isVerified && (
              <CheckCircle className="w-6 h-6 text-green-400" />
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-white/60">
            {garageProfile?.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {garageProfile.address.city}, {garageProfile.address.district}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span className="text-sm font-medium text-white">
                {stats.rating.toFixed(1)} Rating
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {garageProfile?.membership && (
            <div
              className={`px-4 py-2 rounded-xl border ${
                garageProfile.membership.tier === "premium"
                  ? "bg-orange-500/10 border-orange-500/30 text-orange-500"
                  : garageProfile.membership.tier === "basic"
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                  : "bg-white/5 border-white/10 text-white/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                <span className="text-sm font-bold capitalize">
                  {garageProfile.membership.tier} Plan
                </span>
              </div>
              {garageProfile.membership.expiry && (
                <p className="text-[10px] opacity-70 mt-0.5">
                  Expires:{" "}
                  {new Date(
                    garageProfile.membership.expiry
                  ).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
          <Link
            href="/garage/dashboard/services/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add Service
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
          <p className="text-white/60 text-sm mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-white">{stats.totalBookings}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
          <p className="text-white/60 text-sm mb-1">Monthly Revenue</p>
          <p className="text-2xl font-bold text-green-400">
            ৳{stats.monthlyRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
          <p className="text-white/60 text-sm mb-1">Rating</p>
          <p className="text-2xl font-bold text-orange-500">
            {stats.rating.toFixed(1)} ★
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
          <p className="text-white/60 text-sm mb-1">Active Requests</p>
          <p className="text-2xl font-bold text-blue-400">
            {stats.activeRequests}
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
          <p className="text-white/60 text-sm mb-1">Completed Today</p>
          <p className="text-2xl font-bold text-purple-400">
            {stats.completedToday}
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
          <p className="text-white/60 text-sm mb-1">Success Rate</p>
          <p className="text-2xl font-bold text-green-400">
            {stats.successRate.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Revenue Chart and Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart bookings={bookings} />
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Pending</span>
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-medium">
                {bookings.filter((b) => b.status === "pending").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Accepted</span>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium">
                {bookings.filter((b) => b.status === "accepted").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Completed</span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">
                {bookings.filter((b) => b.status === "completed").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Canceled</span>
              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium">
                {bookings.filter((b) => b.status === "canceled").length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Bookings Table */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Active Bookings</h2>
        <BookingTable
          type="garage"
          bookings={bookings}
          onRefresh={() => window.location.reload()}
        />
      </div>
    </div>
  );
}
