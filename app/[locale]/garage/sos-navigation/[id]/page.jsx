"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import axiosInstance from "@/lib/axios";
import { toast } from "react-toastify";
import {
  Phone,
  MapPin,
  Navigation,
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Car,
} from "lucide-react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Dynamically import MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/maps/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-white/5 animate-pulse flex items-center justify-center">
      <p className="text-white/40">Loading Map...</p>
    </div>
  ),
});

export default function SOSNavigationPage() {
  const params = useParams();
  const router = useRouterWithLoading(); // Regular routing
  const [sos, setSos] = useState(null);
  const [garage, setGarage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [distance, setDistance] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Fetch Garage Profile for location
      const garageRes = await axiosInstance.get("/garages/profile");
      if (garageRes.data.success) {
        setGarage(garageRes.data.garage);
      }

      // 2. Fetch SOS alert details
      const sosRes = await axiosInstance.get(`/sos?id=${params.id}`);
      if (sosRes.data.success) {
        // Find the specific SOS in the array
        const foundSos = sosRes.data.data.find((s) => s._id === params.id);
        if (foundSos) {
          setSos(foundSos);
        } else {
          toast.error("SOS Alert not found");
          router.push("/garage/dashboard");
        }
      }
    } catch (error) {
      console.error("SOS Nav Fetch Error:", error);
      toast.error("Failed to load navigation data");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResolve = async () => {
    try {
      setIsUpdating(true);
      const res = await axiosInstance.patch("/sos", {
        sosId: sos._id,
        status: "resolved",
      });
      if (res.data.success) {
        toast.success("SOS Emergency Resolved!");
        router.push("/garage/dashboard");
      }
    } catch (err) {
      toast.error("Failed to resolve SOS");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-white/60">Preparing Navigation...</p>
        </div>
      </div>
    );
  }

  if (!sos) return null;

  const userCoords = [sos.location.coordinates[1], sos.location.coordinates[0]];
  const garageCoords = garage
    ? [garage.location.coordinates[1], garage.location.coordinates[0]]
    : null;

  const markers = [
    {
      lat: userCoords[0],
      lng: userCoords[1],
      content: (
        <div className="p-2">
          <p className="font-bold text-red-600">User Needs Help!</p>
          <p className="text-xs">{sos.user?.name}</p>
        </div>
      ),
      icon:
        typeof window !== "undefined"
          ? new L.Icon({
              iconUrl:
                "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
              shadowUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            })
          : null,
    },
  ];

  if (garageCoords) {
    markers.push({
      lat: garageCoords[0],
      lng: garageCoords[1],
      content: (
        <div className="p-2">
          <p className="font-bold text-blue-600">Your Garage</p>
        </div>
      ),
      icon:
        typeof window !== "undefined"
          ? new L.Icon({
              iconUrl:
                "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
              shadowUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            })
          : null,
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:flex-row overflow-hidden bg-[#111]">
      {/* Left Column: Map - Expanded */}
      <div className="relative flex-1 h-2/3 lg:h-full">
        <MapComponent
          center={userCoords}
          zoom={14}
          markers={markers}
          className="h-full w-full"
        />

        {/* Navigation Overlay */}
        <div className="absolute top-4 left-4 right-4 lg:hidden z-10">
          <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
            <Link
              href="/garage/dashboard"
              className="p-2 bg-white/5 rounded-lg"
            >
              <ChevronLeft className="text-white" />
            </Link>
            <div className="text-center flex-1">
              <h2 className="text-white font-bold text-sm">
                Responding to SOS
              </h2>
              <p className="text-orange-500 text-[10px] font-bold uppercase">
                {sos.status}
              </p>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      {/* Right Column: SOS Details & Navigation Info */}
      <div className="w-full lg:w-96 bg-[#1A1A1A] border-l border-white/10 flex flex-col h-1/3 lg:h-full overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="hidden lg:block">
            <Link
              href="/garage/dashboard"
              className="text-white/40 hover:text-white flex items-center gap-1 text-xs mb-4 transition-colors"
            >
              <ChevronLeft size={14} /> Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold text-white mb-1">
              SOS Navigation
            </h1>
            <p className="text-orange-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
              {sos.status} Alert
            </p>
          </div>

          {/* User Profile Hook */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
                <span className="text-white font-bold text-lg">
                  {sos.user?.name?.[0] || "U"}
                </span>
              </div>
              <div>
                <h3 className="text-white font-bold">
                  {sos.user?.name || "Anonymous User"}
                </h3>
                <p className="text-white/40 text-xs flex items-center gap-1">
                  <Clock size={12} /> Requested{" "}
                  {new Date(sos.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center gap-3 text-sm">
                <Car size={16} className="text-orange-400" />
                <span className="text-white/80">
                  {sos.vehicleType || "Passenger Vehicle"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-orange-400" />
                <span className="text-white/80 line-clamp-2">
                  {sos.location?.address || "GPS Location Locked"}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Actions */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`tel:${sos.phone}`}
              className="flex items-center justify-center gap-2 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-green-500/10"
            >
              <Phone size={20} /> Call Now
            </a>
            <button
              className="flex items-center justify-center gap-2 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/10"
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${userCoords[0]},${userCoords[1]}`;
                window.open(url, "_blank");
              }}
            >
              <Navigation size={20} /> Open GPS
            </button>
          </div>

          {/* Resolution Card */}
          <div className="pt-6 border-t border-white/5">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" />
              Service Status
            </h4>
            <button
              onClick={handleResolve}
              disabled={isUpdating}
              className="w-full py-5 bg-white/5 hover:bg-orange-500 text-white border border-white/10 hover:border-orange-500 rounded-3xl font-bold transition-all flex items-center justify-center gap-3 group"
            >
              {isUpdating ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  Mark as Resolved
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full group-hover:bg-white transition-colors"></span>
                </>
              )}
            </button>
            <p className="text-white/30 text-[10px] text-center mt-3 uppercase tracking-tighter">
              Verify completion with user before resolving
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
