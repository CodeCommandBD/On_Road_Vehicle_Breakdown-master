import { useEffect, useState } from "react";
import EnhancedStatsCards from "@/components/dashboard/EnhancedStatsCards";
import BookingTable from "@/components/dashboard/BookingTable";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import QuickActions from "@/components/dashboard/QuickActions";
import BookingTimeline from "@/components/dashboard/BookingTimeline";
import LiveGarageTracker from "@/components/dashboard/LiveGarageTracker";
import UserRewardsCard from "@/components/dashboard/UserRewardsCard";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export default function UserDashboard({ user }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    points: 0,
    activeRequests: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const response = await axios.get(
          `/api/bookings?userId=${user._id}&role=user`
        );
        if (response.data.success) {
          const fetchedBookings = response.data.bookings;
          setBookings(fetchedBookings);

          // Calculate Stats
          const totalBookings = fetchedBookings.length;
          const activeRequests = fetchedBookings.filter(
            (b) =>
              b.status === "pending" ||
              b.status === "confirmed" ||
              b.status === "in_progress"
          ).length;
          const totalSpent = fetchedBookings.reduce(
            (acc, curr) => acc + (curr.estimatedCost || 0),
            0
          );

          setStats({
            totalBookings,
            totalSpent,
            points: Math.floor(totalSpent / 100), // 1 point per 100 BDT spent
            activeRequests,
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
    <div className="min-h-screen">
      {/* Dashboard Header */}
      <DashboardHeader user={user} notificationCount={stats.activeRequests} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Enhanced Stats Cards */}
      <EnhancedStatsCards stats={stats} />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Left Column - Booking Timeline (2 cols on large screens) */}
        <div className="lg:col-span-2">
          <BookingTimeline bookings={bookings} />
        </div>

        {/* Right Column - Live Garage Tracker */}
        <div className="lg:col-span-1">
          <LiveGarageTracker />
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Rewards Card */}
        <div className="lg:col-span-1">
          <UserRewardsCard user={user} stats={stats} />
        </div>

        {/* Booking Table (Full Width) */}
        <div className="lg:col-span-2">
          <div className="bg-[#1E1E1E] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 fade-in">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
              All Bookings
            </h3>
            <BookingTable type="user" bookings={bookings} />
          </div>
        </div>
      </div>
    </div>
  );
}
