"use client";

import { useEffect, useState, useRef } from "react";
import StatsCards from "@/components/dashboard/StatsCards";
import BookingTable from "@/components/dashboard/BookingTable";
import RevenueChart from "@/components/dashboard/RevenueChart";
import GarageMapDashboard from "@/components/dashboard/GarageMapDashboard";
import {
  Plus,
  Loader2,
  MapPin,
  Star,
  CheckCircle,
  Crown,
  Siren,
  AlertTriangle,
  Navigation,
  Phone,
  AlertCircle,
  Clock,
  Bell,
  X,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";

export default function GarageDashboard({ user }) {
  const [bookings, setBookings] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [assignedSos, setAssignedSos] = useState([]);
  const [garageProfile, setGarageProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [stats, setStats] = useState({
    totalBookings: 0,
    monthlyRevenue: 0,
    rating: 0,
    activeRequests: 0,
    completedToday: 0,
    successRate: 0,
  });
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedSosId, setSelectedSosId] = useState(null);
  const [isProcessingAccept, setIsProcessingAccept] = useState(false);
  const [isProcessingResolve, setIsProcessingResolve] = useState(false);
  const [newAlert, setNewAlert] = useState(null);
  const [prevSosCount, setPrevSosCount] = useState(null);
  const prevCountRef = useRef(null);

  const fetchData = async (showToast = false) => {
    if (!user) return;
    try {
      // Fetch garage profile, bookings, and SOS alerts in parallel
      const [garageRes, bookingsRes, sosRes] = await Promise.all([
        axios.get("/api/garages/profile"),
        axios.get(`/api/bookings?userId=${user._id}&role=garage`),
        axios.get("/api/sos?status=pending,assigned"),
      ]);

      if (garageRes.data.success) {
        setGarageProfile(garageRes.data.garage);
      }

      if (sosRes.data.success) {
        const allSos = sosRes.data.data;
        const pendingAlerts = allSos.filter((s) => s.status === "pending");
        const assignedAlerts = allSos.filter((s) => s.status === "assigned");

        // Detect new SOS alert
        const currentCount = pendingAlerts.length;
        const prevCount = prevCountRef.current;

        // Trigger alert if:
        // 1. First time checking and there are pending alerts
        // 2. Count has increased
        const shouldNotify =
          (prevCount === null && currentCount > 0) ||
          (prevCount !== null && currentCount > prevCount);

        console.log("SOS Notification Internal Sync:", {
          currentCount,
          prevCount,
          shouldNotify,
        });

        if (shouldNotify) {
          const latestAlert = pendingAlerts[0];
          let distance = "Nearby";

          if (
            garageRes.data.garage?.location?.coordinates &&
            latestAlert.location?.coordinates
          ) {
            const garageCoords = garageRes.data.garage.location.coordinates;
            const alertCoords = latestAlert.location.coordinates;

            const d =
              Math.sqrt(
                Math.pow(garageCoords[1] - alertCoords[1], 2) +
                  Math.pow(garageCoords[0] - alertCoords[0], 2)
              ) * 111;
            distance = d.toFixed(1) + "km";
          }

          console.log("🔥 SOS NOTIFICATION TRIGGERED!", {
            user: latestAlert.user?.name,
            distance,
          });

          // 1. Set Floating Alert
          setNewAlert({
            id: latestAlert._id,
            distance: distance,
            user: latestAlert.user?.name || "Unknown User",
          });

          // 2. Browser Toast (Fallback)
          toast.error(
            `🚨 EMERGENCY SOS: ${
              latestAlert.user?.name || "Someone"
            } needs help!`,
            {
              position: "top-center",
              autoClose: 10000,
            }
          );

          // 3. Sound Alert
          playSound();

          // Auto-dismiss floating alert after 15s
          setTimeout(() => setNewAlert(null), 15000);
        }

        // Update previous count
        prevCountRef.current = pendingAlerts.length;
        setPrevSosCount(pendingAlerts.length);
        setSosAlerts(pendingAlerts);
        setAssignedSos(assignedAlerts);
      }

      if (bookingsRes.data.success) {
        const fetchedBookings = bookingsRes.data.bookings;
        setBookings(fetchedBookings);

        // Calculate Stats
        const totalBookings = fetchedBookings.length;
        const activeRequests = fetchedBookings.filter(
          (b) =>
            b.status === "pending" ||
            b.status === "accepted" ||
            b.status === "in_progress"
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
      setLastUpdated(new Date());
      if (showToast) toast.success("Data refreshed");
    } catch (error) {
      console.error("Dashboard Error:", error);
      if (showToast) toast.error("Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSOS = (sosId) => {
    setSelectedSosId(sosId);
    setShowAcceptModal(true);
  };

  const executeAcceptSOS = async () => {
    if (!selectedSosId) return;
    setIsProcessingAccept(true);
    try {
      const res = await axios.patch("/api/sos", {
        sosId: selectedSosId,
        status: "assigned",
      });
      if (res.data.success) {
        toast.success("SOS ACCEPTED! Please head to the location immediately.");
        setShowAcceptModal(false);
        setSelectedSosId(null);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept SOS");
    } finally {
      setIsProcessingAccept(false);
    }
  };

  const handleResolveSOS = (sosId) => {
    setSelectedSosId(sosId);
    setShowResolveModal(true);
  };

  const executeResolveSOS = async () => {
    if (!selectedSosId) return;
    setIsProcessingResolve(true);
    try {
      const res = await axios.patch("/api/sos", {
        sosId: selectedSosId,
        status: "resolved",
      });
      if (res.data.success) {
        toast.success("SOS Case Resolved and Closed!");
        setShowResolveModal(false);
        setSelectedSosId(null);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resolve SOS");
    } finally {
      setIsProcessingResolve(false);
    }
  };

  const handleTrackUser = (sos) => {
    const lat = sos.location.coordinates[1];
    const lng = sos.location.coordinates[0];
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  const playSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "siren";
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        880,
        audioCtx.currentTime + 0.5
      );
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log("Sound play failed", e);
    }
  };

  const triggerTestAlert = () => {
    setNewAlert({
      id: "test-" + Date.now(),
      distance: "2.5km",
      user: "Test User (Demo)",
    });
    toast.info("🚨 This is a TEST Alert demonstration!", {
      position: "top-right",
    });
    playSound(); // Call playSound for test alert
    setTimeout(() => setNewAlert(null), 10000);
  };

  useEffect(() => {
    fetchData();
    // Poll for updates every 30 seconds
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
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
      {/* Floating New SOS Alert Notification */}
      {newAlert && (
        <div className="fixed top-6 right-6 z-[99999] transition-all transform translate-x-0 opacity-100 scale-100">
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl shadow-2xl shadow-red-500/50 p-4 min-w-[320px] border-2 border-red-400">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Bell className="text-white animate-pulse" size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-sm">🚨 New Emergency Alert!</h4>
                </div>
                <p className="text-xs text-white/90 mb-2">
                  {newAlert.user} is{" "}
                  {newAlert.distance === "Nearby"
                    ? "Nearby"
                    : `${newAlert.distance} away`}
                </p>
                <button
                  onClick={() => {
                    const element =
                      document.getElementById("garage-map-section");
                    element?.scrollIntoView({ behavior: "smooth" });
                    setNewAlert(null);
                  }}
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition-all"
                >
                  View on Map
                </button>
              </div>
              <button
                onClick={() => setNewAlert(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

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
          <button
            onClick={triggerTestAlert}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl text-xs font-medium border border-white/10 transition-all"
          >
            Test Alert
          </button>
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

      {/* Map Dashboard */}
      <div id="garage-map-section">
        <GarageMapDashboard
          bookings={bookings.filter(
            (b) =>
              b.status === "accepted" ||
              b.status === "in_progress" ||
              b.status === "pending"
          )}
          sosAlerts={sosAlerts}
          garageLocation={garageProfile?.location}
          onRefresh={fetchData}
          onAcceptSOS={handleAcceptSOS}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* SOS Acceptance Confirmation Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1A1A1A] border border-red-500/20 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)] scale-in">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 relative">
                <Siren className="text-red-500" size={40} />
                <span className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                Accept Emergency SOS?
              </h3>
              <p className="text-white/60 mb-8 leading-relaxed">
                By accepting this, you confirm that a mechanic is available and
                will respond to the user's location immediately. Rate of
                response is critical.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={executeAcceptSOS}
                  disabled={isProcessingAccept}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                >
                  {isProcessingAccept ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Confirm & Respond Now
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAcceptModal(false);
                    setSelectedSosId(null);
                  }}
                  disabled={isProcessingAccept}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 rounded-2xl font-bold transition-all border border-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="bg-red-500/5 p-4 border-t border-red-500/10 flex items-center gap-2 text-[10px] text-red-400 font-medium">
              <AlertTriangle size={12} />
              <span>
                Warning: Frequent cancellations after acceptance may affect your
                garage rating.
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Active SOS Tasks Section */}
      {assignedSos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-bold text-white">Active SOS Tasks</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedSos.map((sos) => (
              <div
                key={sos._id}
                className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 hover:bg-red-500/10 transition-all flex flex-col sm:flex-row justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-red-500/20 text-red-500 rounded text-[10px] font-bold uppercase tracking-wider">
                      Emergency Alert
                    </div>
                    <span className="text-white/40 text-xs">
                      {new Date(sos.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold">
                      {sos.user?.name || "Unknown User"}
                    </h4>
                    <p className="text-white/60 text-sm flex items-center gap-1">
                      <MapPin size={12} /> {sos.location.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`tel:${sos.phone}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg border border-white/10 transition-all"
                    >
                      <Phone size={14} className="text-blue-400" />
                      {sos.phone}
                    </a>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col gap-2 justify-end">
                  <button
                    onClick={() => handleTrackUser(sos)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 rounded-xl text-xs font-bold transition-all shadow-lg"
                  >
                    <Navigation size={14} />
                    Track User
                  </button>
                  <button
                    onClick={() => handleResolveSOS(sos._id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                  >
                    <CheckCircle size={14} />
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolve SOS Confirmation Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1A1A1A] border border-green-500/20 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.1)] scale-in">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <CheckCircle className="text-green-500" size={40} />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                Case Resolved?
              </h3>
              <p className="text-white/60 mb-8 leading-relaxed">
                Are you sure the emergency has been handled and the vehicle is
                safe to continue or being towed? This will close the SOS alert.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={executeResolveSOS}
                  disabled={isProcessingResolve}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessingResolve ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Resolving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Yes, Resolve Case
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setSelectedSosId(null);
                  }}
                  disabled={isProcessingResolve}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 rounded-2xl font-bold transition-all border border-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
