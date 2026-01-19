"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import GarageMapDashboard from "@/components/dashboard/GarageMapDashboard";
import {
  Loader2,
  Navigation,
  Phone,
  CheckCircle,
  Siren,
  AlertTriangle,
  X,
  MapPin,
  ChevronLeft,
  Activity,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import axios from "axios";
import { toast } from "react-toastify";

export default function MissionControlPage() {
  const user = useSelector(selectUser);
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedSosId, setSelectedSosId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["missionControlData"],
    queryFn: async () => {
      const [garageRes, bookingsRes, sosRes] = await Promise.all([
        axiosInstance.get("/api/garages/profile"),
        axiosInstance.get(`/api/bookings?userId=${user._id}&role=garage`),
        axiosInstance.get("/api/sos?status=pending,assigned"),
      ]);

      const allSos = sosRes.data.data || [];
      const unfilteredBookings = bookingsRes.data.bookings || [];

      const sosAlerts = allSos.filter((s) => s.status === "pending");
      const assignedSos = allSos.filter((s) => s.status === "assigned");
      const bookings = unfilteredBookings.filter(
        (b) =>
          b.status === "pending" ||
          b.status === "accepted" ||
          b.status === "in_progress",
      );

      setLastUpdated(new Date());
      return {
        garageProfile: garageRes.data.garage,
        sosAlerts,
        assignedSos,
        bookings,
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const garageProfile = data?.garageProfile;
  const sosAlerts = data?.sosAlerts || [];
  const assignedSos = data?.assignedSos || [];
  const bookings = data?.bookings || [];

  const fetchData = () =>
    queryClient.invalidateQueries({ queryKey: ["missionControlData"] });

  const handleAcceptSOS = (sosId) => {
    setSelectedSosId(sosId);
    setShowAcceptModal(true);
  };

  const sosMutation = useMutation({
    mutationFn: async ({ sosId, status }) => {
      const res = await axiosInstance.patch("/api/sos", { sosId, status });
      return res.data;
    },
    onSuccess: (data, variables) => {
      if (variables.status === "assigned") {
        toast.success("MISSION ACCEPTED! Head to location.");
        setShowAcceptModal(false);
      } else if (variables.status === "resolved") {
        toast.success("Mission Accomplished!");
        setShowResolveModal(false);
      }
      setSelectedSosId(null);
      fetchData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update mission");
    },
  });

  const executeAcceptSOS = () => {
    if (!selectedSosId) return;
    sosMutation.mutate({ sosId: selectedSosId, status: "assigned" });
  };

  const executeResolveSOS = () => {
    if (!selectedSosId) return;
    sosMutation.mutate({ sosId: selectedSosId, status: "resolved" });
  };

  const isProcessingAccept =
    sosMutation.isPending && sosMutation.variables?.status === "assigned";
  const isProcessingResolve =
    sosMutation.isPending && sosMutation.variables?.status === "resolved";

  const handleTrackUser = (sos) => {
    const lat = sos.location.coordinates[1];
    const lng = sos.location.coordinates[0];
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#111]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-white/60">Initializing Mission Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/garage/dashboard"
            className="text-xs text-white/40 hover:text-orange-400 transition-colors flex items-center gap-1 mb-2 group"
          >
            <ChevronLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-orange-500" />
            Live Mission Control
          </h1>
          <p className="text-white/60 text-sm">
            Real-time emergency monitoring and active task management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] text-white/60 uppercase font-bold tracking-widest">
            Pulse: Online
          </div>
        </div>
      </div>

      {/* Main Map Dashboard */}
      <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <GarageMapDashboard
          bookings={bookings}
          sosAlerts={sosAlerts}
          garageLocation={garageProfile?.location}
          onRefresh={fetchData}
          onAcceptSOS={handleAcceptSOS}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* Active SOS Missions Section */}
      {assignedSos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">
              Active Rescue Missions
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedSos.map((sos) => (
              <div
                key={sos._id}
                className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 hover:bg-red-500/10 transition-all flex flex-col lg:flex-row justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-red-500 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                      Critical mission
                    </div>
                    <span className="text-white/40 text-xs">
                      {new Date(sos.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">
                      {sos.user?.name || "Unknown Citizen"}
                    </h4>
                    <p className="text-white/60 text-sm flex items-center gap-1">
                      <MapPin size={12} className="text-red-400" />{" "}
                      {sos.location.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`tel:${sos.phone}`}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-xl border border-white/10 transition-all"
                    >
                      <Phone size={14} className="text-green-400" />
                      Contact User
                    </a>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-2 justify-end">
                  <button
                    onClick={() => handleTrackUser(sos)}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-black hover:bg-white/90 rounded-2xl text-xs font-bold transition-all shadow-lg"
                  >
                    <Navigation size={14} />
                    Track
                  </button>
                  <button
                    onClick={() => handleResolveSOS(sos._id)}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg"
                  >
                    <CheckCircle size={14} />
                    Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acceptance Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#1A1A1A] border border-red-500/20 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.2)]">
            <div className="p-8 text-center text-white">
              <Siren
                className="text-red-500 mx-auto mb-4 animate-bounce"
                size={48}
              />
              <h3 className="text-2xl font-bold mb-2">Accept SOS Call?</h3>
              <p className="text-white/60 mb-6 italic text-sm">
                "Lives and vehicles depend on your response speed."
              </p>
              <div className="space-y-3">
                <button
                  onClick={executeAcceptSOS}
                  disabled={isProcessingAccept}
                  className="w-full py-4 bg-red-600 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  {isProcessingAccept ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <CheckCircle />
                  )}
                  Deploy Mechanic Now
                </button>
                <button
                  onClick={() => setShowAcceptModal(false)}
                  className="w-full py-4 bg-white/5 rounded-2xl"
                >
                  Abort
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#1A1A1A] border border-green-500/20 rounded-3xl w-full max-w-md overflow-hidden">
            <div className="p-8 text-center text-white">
              <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
              <h3 className="text-2xl font-bold mb-2">Mission Complete?</h3>
              <p className="text-white/60 mb-6 text-sm">
                Confirm that the citizen is safe and the issue is resolved.
              </p>
              <div className="space-y-3">
                <button
                  onClick={executeResolveSOS}
                  disabled={isProcessingResolve}
                  className="w-full py-4 bg-green-600 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  {isProcessingResolve ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <CheckCircle />
                  )}
                  Resolve Mission
                </button>
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="w-full py-4 bg-white/5 rounded-2xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
