import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import EnhancedStatsCards from "@/components/dashboard/EnhancedStatsCards";
import BookingTable from "@/components/dashboard/BookingTable";
import QuickActions from "@/components/dashboard/QuickActions";
import BookingTimeline from "@/components/dashboard/BookingTimeline";
import dynamic from "next/dynamic";
const LiveGarageTracker = dynamic(
  () => import("@/components/dashboard/LiveGarageTracker"),
  { ssr: false },
);
import UserRewardsCard from "@/components/dashboard/UserRewardsCard";
import LeaderboardWidget from "@/components/dashboard/LeaderboardWidget";
import SubscriptionCard from "@/components/dashboard/SubscriptionCard";
import Link from "next/link";
import {
  Wrench,
  Siren,
  Phone,
  AlertCircle,
  X,
  Heart,
  MapPin,
  Star,
  ArrowRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { toast } from "react-toastify";
import {
  updateUser,
  selectFavorites,
  toggleFavoriteSuccess,
} from "@/store/slices/authSlice";
import { useTranslations } from "next-intl";

// Internal Countdown Component for SLA
const Countdown = ({ date }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculate = () => {
      const difference = new Date(date) - new Date();
      if (difference <= 0) {
        setTimeLeft("EXPIRED");
        return;
      }
      const mins = Math.floor((difference / 1000 / 60) % 60);
      const secs = Math.floor((difference / 1000) % 60);
      setTimeLeft(`${mins}m ${secs}s`);
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [date]);

  return (
    <span className="text-xs font-mono text-white font-bold">{timeLeft}</span>
  );
};

export default function UserDashboard({ user }) {
  const t = useTranslations("SOS");
  const dashT = useTranslations("Dashboard");
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const favorites = useSelector(selectFavorites);

  // 1. Fetch Bookings & Stats
  const { data: dashboardData, isLoading: isBookingsLoading } = useQuery({
    queryKey: ["userDashboardData", user?._id],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/api/bookings?userId=${user._id}&role=user`,
      );
      const fetchedBookings = response.data.bookings || [];

      const totalBookings = fetchedBookings.length;
      const activeRequests = fetchedBookings.filter((b) =>
        ["pending", "confirmed", "in_progress"].includes(b.status),
      ).length;
      const totalSpent = fetchedBookings.reduce(
        (acc, curr) => acc + (curr.estimatedCost || 0),
        0,
      );

      return {
        bookings: fetchedBookings,
        stats: {
          totalBookings,
          totalSpent,
          points: Math.floor(totalSpent / 100), // Base fallback
          activeRequests,
        },
      };
    },
    enabled: !!user?._id,
  });

  // 2. Fetch Points
  const { data: pointsData } = useQuery({
    queryKey: ["userPoints", user?._id],
    queryFn: async () => {
      const response = await axiosInstance.get("/api/user/points");
      return response.data.rewardPoints;
    },
    enabled: !!user?._id,
  });

  // 3. Fetch SOS
  const { data: activeSOS } = useQuery({
    queryKey: ["activeSOS"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        "/api/sos?status=pending,assigned",
      );
      return response.data.data?.[0] || null;
    },
    refetchInterval: 10000, // Sync emergency status every 10s
  });

  // 4. Fetch Full Favorites (if needed)
  const { isLoading: isLoadingFavorites } = useQuery({
    queryKey: ["userFavorites"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/user/favorites");
      if (res.data.success) {
        dispatch({
          type: "auth/updateUser",
          payload: { favoriteGarages: res.data.favorites },
        });
      }
      return res.data.favorites;
    },
    enabled: !!user?._id && favorites.some((fav) => typeof fav === "string"),
  });

  // Mutations
  const removeFavoriteMutation = useMutation({
    mutationFn: async (garageId) => {
      await axiosInstance.post("/api/user/favorites", { garageId });
      return garageId;
    },
    onSuccess: (garageId) => {
      dispatch(toggleFavoriteSuccess(garageId));
      toast.success("Removed from favorites");
      queryClient.invalidateQueries({ queryKey: ["userFavorites"] });
    },
  });

  const cancelSOSMutation = useMutation({
    mutationFn: async (sosId) => {
      const res = await axiosInstance.patch("/api/sos", {
        sosId,
        status: "cancelled",
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("SOS Alert Cancelled");
      setShowCancelModal(false);
      queryClient.invalidateQueries({ queryKey: ["activeSOS"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to cancel SOS");
    },
  });

  // Derived state
  const bookings = dashboardData?.bookings || [];
  const stats = {
    ...(dashboardData?.stats || {}),
    points: pointsData ?? (dashboardData?.stats?.points || 0),
  };
  const isLoading = isBookingsLoading;
  const isCancelling = cancelSOSMutation.isPending;

  const removeFavorite = (garageId) => {
    removeFavoriteMutation.mutate(garageId);
  };

  const handleCancelSOS = () => {
    setShowCancelModal(true);
  };

  const executeCancelSOS = () => {
    if (activeSOS) {
      cancelSOSMutation.mutate(activeSOS._id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Wrench className="w-12 h-12 animate-spin text-orange-500" />
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
                  {t("emergencySOS")}
                </h2>
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                  LIVE
                </span>
              </div>
              <p className="text-red-400 text-sm font-medium mt-1">
                {activeSOS.status === "pending"
                  ? t("lookingForHelp")
                  : t("helpIsComing", {
                      garageName: activeSOS.assignedGarage?.name,
                    })}
              </p>

              {/* SLA Deadline Countdown */}
              {activeSOS.slaDeadline && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-tighter">
                      SLA Deadline:
                    </span>
                    <Countdown date={activeSOS.slaDeadline} />
                  </div>
                </div>
              )}
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
                <Phone size={16} /> {t("callNow")}
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
                <Wrench size={16} className="animate-spin" />
                {t("cancelling")}
              </>
            ) : (
              <>
                <X size={16} />
                {t("cancelSOS")}
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
                {t("confirmCancel")}
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
                  {t("keepActive")}
                </button>
                <button
                  onClick={executeCancelSOS}
                  disabled={isCancelling}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCancelling ? (
                    <>
                      <Wrench size={20} className="animate-spin" />
                      {t("cancelling")}
                    </>
                  ) : (
                    <>
                      <X size={20} />
                      {t("yesCancel")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions
        onSOSSent={() =>
          queryClient.invalidateQueries({ queryKey: ["activeSOS"] })
        }
      />

      {/* Enhanced Stats Cards */}
      <EnhancedStatsCards stats={stats} />

      {/* Main Grid Layout - Booking Timeline Spans Full Width */}
      <div className="mb-8 sm:mb-10">
        <BookingTimeline bookings={bookings} />
      </div>

      {/* Favorite Garages Section */}
      {(favorites.length > 0 || isLoadingFavorites) && (
        <div className="mb-10 overflow-hidden">
          <div className="flex items-center justify-between mb-5 px-1">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              Favorite Garages
            </h3>
            <Link
              href="/garages"
              className="text-xs sm:text-sm text-orange-500 hover:text-orange-400 font-bold flex items-center gap-1 transition-colors bg-orange-500/5 px-3 py-1.5 rounded-full border border-orange-500/10"
            >
              Explore More <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoadingFavorites ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="min-w-[280px] h-32 bg-[#1E1E1E] border border-white/5 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
              {favorites.map((garage) => (
                <div
                  key={garage._id || garage}
                  className="min-w-[280px] sm:min-w-[300px] bg-[#1E1E1E] border border-white/10 rounded-2xl p-4 peer hover:border-orange-500/50 transition-all group snap-start shadow-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden border border-white/5">
                        {garage.logo ? (
                          <img
                            src={garage.logo}
                            alt={garage.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-orange-500">
                            {garage.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm sm:text-base truncate">
                          {garage.name}
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-yellow-500">
                          <Star className="w-3 h-3 fill-yellow-500" />
                          <span>{garage.rating?.average || "5.0"}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFavorite(garage._id)}
                      className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shrink-0"
                      title="Remove from favorites"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/40 mb-4">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {garage.address?.street}, {garage.address?.city}
                    </span>
                  </div>

                  <Link
                    href={`/book?garage=${garage._id}`}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-orange-500 text-white rounded-xl text-[11px] sm:text-xs font-bold transition-all border border-white/5 group-hover:border-orange-500"
                  >
                    Quick Book
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
              {t("allBookings")}
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
