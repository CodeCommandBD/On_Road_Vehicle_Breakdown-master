"use client";

import {
  Siren,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";

const MapComponent = dynamic(() => import("@/components/maps/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-white/5 animate-pulse rounded-xl" />
  ),
});

export default function EmergencySOS() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]);
  const [selectedSOS, setSelectedSOS] = useState(null);
  const [nearbyGarages, setNearbyGarages] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/sos?status=pending,assigned");
      if (response.data.success) {
        setAlerts(response.data.data);
        if (response.data.data.length > 0) {
          const firstAlert = response.data.data[0].location.coordinates;
          setMapCenter([firstAlert[1], firstAlert[0]]);
        }
      }
    } catch (error) {
      console.error("Error fetching SOS alerts:", error);
      toast.error("Failed to fetch emergency alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const handleAssignClick = async (sos) => {
    setSelectedSOS(sos);
    setIsAssigning(true);
    setNearbyGarages([]);
    try {
      const lat = sos.location.coordinates[1];
      const lng = sos.location.coordinates[0];
      const res = await axios.get(
        `/api/garages/nearby?lat=${lat}&lng=${lng}&maxDistance=20000`
      );
      if (res.data.success) {
        setNearbyGarages(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching nearby garages:", error);
      toast.error("Failed to find nearby garages");
    }
  };

  const handleConfirmAssignment = async (garageId) => {
    if (!selectedSOS) return;
    setIsActionLoading(true);
    try {
      const res = await axios.patch("/api/sos", {
        sosId: selectedSOS._id,
        garageId: garageId,
      });
      if (res.data.success) {
        toast.success("Garage assigned successfully!");
        setIsAssigning(false);
        setSelectedSOS(null);
        fetchAlerts();
      }
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error(error.response?.data?.message || "Failed to assign mechanic");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResolveClick = (sosId) => {
    setSelectedSOS({ _id: sosId }); // Basic object for consistency
    setShowResolveModal(true);
  };

  const executeResolve = async () => {
    if (!selectedSOS) return;
    setIsActionLoading(true);
    try {
      const res = await axios.patch("/api/sos", {
        sosId: selectedSOS._id,
        status: "resolved",
      });
      if (res.data.success) {
        toast.success("SOS alert resolved");
        setShowResolveModal(false);
        setSelectedSOS(null);
        fetchAlerts();
      }
    } catch (error) {
      toast.error("Failed to resolve SOS");
    } finally {
      setIsActionLoading(false);
    }
  };

  const mapMarkers = alerts.map((alert) => ({
    lat: alert.location.coordinates[1],
    lng: alert.location.coordinates[0],
    content: (
      <div>
        <h3 className="font-bold text-red-600">
          EMERGENCY: {alert.user?.name}
        </h3>
        <p className="text-xs">{alert.location.address}</p>
        <p className="text-xs font-bold">{alert.phone}</p>
      </div>
    ),
  }));

  return (
    <div className="bg-[#121212] rounded-2xl border border-red-500/20 overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.05)] mb-8">
      <div className="bg-gradient-to-r from-red-500/10 to-transparent px-6 py-4 border-b border-red-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 bg-red-500/10 rounded-full border border-red-500/20">
            <Siren
              className="text-red-500 animate-pulse relative z-10"
              size={20}
            />
            <span className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></span>
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              Emergency SOS Actions
            </h3>
            <p className="text-xs text-red-400">Immediate attention required</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAlerts}
            className="text-[10px] bg-white/5 hover:bg-white/10 text-white/60 px-2 py-1 rounded transition-colors"
          >
            Refresh
          </button>
          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-red-500/20 animate-pulse">
            {alerts.length} Active Requirements
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="p-0 border-r border-white/5 h-[400px]">
          <MapComponent
            center={mapCenter}
            zoom={12}
            markers={mapMarkers}
            className="h-full w-full"
          />
        </div>

        <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
          {loading && alerts.length === 0 ? (
            <div className="p-10 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-white/40 text-sm">
                Monitoring for SOS alerts...
              </p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-10 text-center">
              <AlertTriangle className="mx-auto text-white/20 mb-3" size={32} />
              <p className="text-white/40 text-sm">
                No active emergency alerts at this time.
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert._id}
                className="p-5 hover:bg-red-500/5 transition-colors group"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white text-lg">
                        {alert.user?.name || "Anonymous User"}
                      </span>
                      <span className="text-xs text-white/30">
                        •{" "}
                        {formatDistanceToNow(new Date(alert.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.status === "assigned" ? (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          Active / Assigned
                        </span>
                      ) : (
                        <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                          Critical / Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {alert.assignedGarage && (
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-2 flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <p className="text-[10px] text-blue-400 font-medium">
                        Assigned to:{" "}
                        <span className="font-bold">
                          {alert.assignedGarage.name}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-white/50 group-hover:text-white/80 transition-colors">
                      <Phone size={14} className="text-[#FF532D]" />{" "}
                      {alert.phone}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-white/50 group-hover:text-white/80 transition-colors">
                      <MapPin
                        size={14}
                        className="text-[#FF532D] mt-1 shrink-0"
                      />
                      <span className="line-clamp-2">
                        {alert.location.address || "Location unavailable"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <a
                      href={`tel:${alert.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 text-white py-2 rounded-xl text-[10px] font-medium transition-all"
                    >
                      <Phone size={12} className="text-green-500" /> Call User
                    </a>
                    <button
                      onClick={() => handleAssignClick(alert)}
                      className={`flex-1 flex items-center justify-center gap-2 ${
                        alert.status === "assigned"
                          ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20"
                          : "bg-[#FF532D] hover:bg-[#F23C13] text-white"
                      } py-2 rounded-xl text-[10px] font-medium transition-all`}
                    >
                      <CheckCircle size={12} />{" "}
                      {alert.status === "assigned" ? "Reassign" : "Assign"}
                    </button>
                    <button
                      onClick={() => handleResolveClick(alert._id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 py-2 rounded-xl text-[10px] font-medium transition-all"
                    >
                      <CheckCircle size={12} /> Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assignment Modal/Overlay */}
      {isAssigning && selectedSOS && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-transparent">
              <div>
                <h4 className="text-white font-bold">Assign Mechanic</h4>
                <p className="text-xs text-white/40">
                  Select a nearby garage for {selectedSOS.user?.name}
                </p>
              </div>
              <button
                onClick={() => setIsAssigning(false)}
                className="p-2 hover:bg-white/5 rounded-lg text-white/40 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {nearbyGarages.length === 0 ? (
                <div className="text-center py-10 text-white/40 italic">
                  No active garages found within 15km
                </div>
              ) : (
                <div className="space-y-3">
                  {nearbyGarages.map((garage) => (
                    <div
                      key={garage._id}
                      className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-orange-500/50 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-white group-hover:text-orange-400">
                            {garage.name}
                          </p>
                          <p className="text-[10px] text-white/40">
                            {garage.address.city}, {garage.address.district}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-orange-500">
                          {(garage.distance / 1000).toFixed(1)} km
                        </span>
                      </div>
                      <button
                        onClick={() => handleConfirmAssignment(garage._id)}
                        disabled={isActionLoading}
                        className="w-full mt-2 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
                      >
                        {isActionLoading
                          ? "Assigning..."
                          : "Assign This Garage"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolve Confirmation Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl scale-in">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                <CheckCircle className="text-green-500" size={32} />
              </div>
              <h4 className="text-white font-bold text-lg mb-2">
                Resolve SOS?
              </h4>
              <p className="text-white/40 text-xs mb-6">
                Marking this alert as resolved will remove it from the active
                emergencies list.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setSelectedSOS(null);
                  }}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={executeResolve}
                  disabled={isActionLoading}
                  className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isActionLoading ? "Resolving..." : "Yes, Resolve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
