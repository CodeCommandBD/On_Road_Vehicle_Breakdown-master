"use client";

import {
  Siren,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

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

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/sos?status=pending");
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

  const handleAssign = (alertId) => {
    toast.info("Assigning mechanic functionality coming soon!");
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
                        • {dayjs(alert.createdAt).fromNow()}
                      </span>
                    </div>
                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Critical
                    </span>
                  </div>

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
                      className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 text-white py-2 rounded-xl text-xs font-medium transition-all"
                    >
                      <Phone size={14} className="text-green-500" /> Call User
                    </a>
                    <button
                      onClick={() => handleAssign(alert._id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#FF532D] hover:bg-[#F23C13] text-white py-2 rounded-xl text-xs font-medium transition-all"
                    >
                      <CheckCircle size={14} /> Assign Mechanic
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
