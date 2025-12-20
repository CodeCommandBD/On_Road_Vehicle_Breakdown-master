import { useEffect, useState } from "react";
import EnhancedStatsCards from "@/components/dashboard/EnhancedStatsCards";
import BookingTable from "@/components/dashboard/BookingTable";
import QuickActions from "@/components/dashboard/QuickActions";
import BookingTimeline from "@/components/dashboard/BookingTimeline";
import LiveGarageTracker from "@/components/dashboard/LiveGarageTracker";
import UserRewardsCard from "@/components/dashboard/UserRewardsCard";
import LeaderboardWidget from "@/components/dashboard/LeaderboardWidget";
import SubscriptionCard from "@/components/dashboard/SubscriptionCard";
import { Loader2, Siren, Phone, AlertCircle, X } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { updateUser } from "@/store/slices/authSlice";

export default function UserDashboard({ user }) {
  const dispatch = useDispatch();
  const [bookings, setBookings] = useState([]);
  const [activeSOS, setActiveSOS] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
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

          // Fetch Points separately for accuracy
          let realPoints = 0;
          try {
            const pointsRes = await axios.get("/api/user/points");
            if (pointsRes.data.success) {
              realPoints = pointsRes.data.rewardPoints;
              // Sync to global Redux state so header updates instantly
              dispatch(
                updateUser({
                  rewardPoints: realPoints,
                  level: pointsRes.data.level,
                })
              );
            }
          } catch (pErr) {
            console.warn("Points fetch failed, using fallback:", pErr);
            realPoints = Math.floor(totalSpent / 100);
          }

          setStats({
            totalBookings,
            totalSpent,
            points: realPoints,
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
    fetchSOS();
  }, [user]);

  const fetchSOS = async () => {
    try {
      const sosRes = await axios.get("/api/sos?status=pending,assigned");
      if (sosRes.data.success && sosRes.data.data.length > 0) {
        setActiveSOS(sosRes.data.data[0]);
      } else {
        setActiveSOS(null);
      }
    } catch (sosError) {
      console.error("SOS Fetch error:", sosError);
    }
  };

  const handleCancelSOS = () => {
    setShowCancelModal(true);
  };

  const executeCancelSOS = async () => {
    if (!activeSOS) return;

    setIsCancelling(true);
    try {
      const res = await axios.patch("/api/sos", {
        sosId: activeSOS._id,
        status: "cancelled",
      });
      if (res.data.success) {
        toast.success("SOS Alert Cancelled");
        setActiveSOS(null);
        setShowCancelModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel SOS");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* SOS Active Card */}
      {activeSOS && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_50px_rgba(239,68,68,0.1)] border-l-4 border-l-red-500">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 shrink-0">
              <Siren className="text-white animate-pulse" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Emergency SOS Active
                </h2>
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                  LIVE
                </span>
              </div>
              <p className="text-red-400 text-sm font-medium mt-1">
                {activeSOS.status === "pending"
                  ? "Looking for nearby garages to respond..."
                  : `Help is coming! Accepted by ${activeSOS.assignedGarage?.name}`}
              </p>
            </div>
          </div>

          {activeSOS.assignedGarage && (
            <div className="flex items-center gap-4 w-full md:w-auto p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex-1 md:text-right">
                <p className="text-white font-bold text-sm">
                  {activeSOS.assignedGarage.name}
                </p>
                <p className="text-xs text-white/40">
                  {activeSOS.assignedGarage.phone}
                </p>
              </div>
              <a
                href={`tel:${activeSOS.assignedGarage.phone}`}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-green-500/20 flex items-center gap-2 text-sm"
              >
                <Phone size={16} /> Call Now
              </a>
            </div>
          )}

          {/* Cancel Button */}
          <button
            onClick={handleCancelSOS}
            disabled={isCancelling}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 rounded-lg font-medium transition-all text-sm disabled:opacity-50"
          >
            {isCancelling ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <X size={16} />
                Cancel SOS
              </>
            )}
          </button>
        </div>
      )}

      {/* Cancel SOS Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1A1A1A] border border-orange-500/20 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(251,146,60,0.1)] scale-in">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
                <AlertCircle className="text-orange-500" size={40} />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                Cancel SOS Alert?
              </h3>
              <p className="text-white/60 mb-8 leading-relaxed">
                {activeSOS?.assignedGarage
                  ? `Are you sure? ${activeSOS.assignedGarage.name} has already been dispatched to help you.`
                  : "Are you sure you want to cancel this emergency request?"}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={isCancelling}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-2xl font-bold transition-all border border-white/5"
                >
                  Keep Alert Active
                </button>
                <button
                  onClick={executeCancelSOS}
                  disabled={isCancelling}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X size={20} />
                      Yes, Cancel SOS
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions onSOSSent={fetchSOS} />

      {/* Enhanced Stats Cards */}
      <EnhancedStatsCards stats={stats} />

      {/* Main Grid Layout - Booking Timeline Spans Full Width */}
      <div className="mb-6 sm:mb-8">
        <BookingTimeline bookings={bookings} />
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Subscription Card */}
        <div className="lg:col-span-1">
          <SubscriptionCard />
        </div>

        {/* Booking Table (spans 2 columns) */}
        <div className="lg:col-span-2">
          <div className="bg-[#1E1E1E] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 fade-in">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
              All Bookings
            </h3>
            <BookingTable type="user" bookings={bookings} />
          </div>
        </div>
      </div>

      {/* Rewards & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <UserRewardsCard user={user} stats={stats} />
        <LeaderboardWidget role="user" />
      </div>
    </div>
  );
}
