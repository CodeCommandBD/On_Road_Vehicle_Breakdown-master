"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  MapPin,
  Navigation,
  StopCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import MapComponent with no SSR
const MapComponent = dynamic(() => import("@/components/maps/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-white/5 animate-pulse rounded-xl flex items-center justify-center">
      <p className="text-white/40">Loading Map...</p>
    </div>
  ),
});

export default function GarageTrackPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Function to send location to server
  const sendLocationUpdate = async (lat, lng) => {
    try {
      // Throttle updates to every 5 seconds
      const now = Date.now();
      if (now - lastUpdateRef.current < 5000) return;

      lastUpdateRef.current = now;

      await fetch(`/api/bookings/${id}/track`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsTracking(true);
    toast.success("Tracking Started! User can now see your location.");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        sendLocationUpdate(latitude, longitude);
      },
      (error) => {
        setError("Unable to retrieve your location");
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    toast.info("Tracking Stopped.");
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link
          href={`/garage/dashboard/bookings/${id}`}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Navigation className="w-6 h-6 text-orange-500" />
            Live Tracking
          </h1>
          <p className="text-white/60 text-sm">
            Share your location with the customer
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-[#1E1E1E] border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isTracking
                ? "bg-green-500/20 text-green-500 animate-pulse"
                : "bg-white/5 text-white/40"
            }`}
          >
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">
              {isTracking ? "Tracking Active" : "Tracking Inactive"}
            </h3>
            <p
              className={`text-sm ${
                isTracking ? "text-green-500" : "text-white/40"
              }`}
            >
              {isTracking
                ? "Updating location every 5s"
                : "Start so user can track you"}
            </p>
          </div>
        </div>

        <button
          onClick={isTracking ? stopTracking : startTracking}
          className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-glow-orange ${
            isTracking
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-orange-500 hover:bg-orange-600 text-white"
          }`}
        >
          {isTracking ? (
            <StopCircle className="w-5 h-5" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
          {isTracking ? "Stop Tracking" : "Start Tracking"}
        </button>
      </div>

      {/* Map View */}
      <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl overflow-hidden shadow-xl p-1">
        {location ? (
          <MapComponent
            center={[location.lat, location.lng]}
            zoom={15}
            markers={[
              {
                lat: location.lat,
                lng: location.lng,
                content: "You (Tow Truck)",
              },
            ]}
            className="h-[500px] w-full rounded-xl"
          />
        ) : (
          <div className="h-[500px] w-full bg-black/20 flex flex-col items-center justify-center text-center p-6">
            <Navigation className="w-16 h-16 text-white/10 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Location Not Available
            </h3>
            <p className="text-white/40 max-w-md">
              Click "Start Tracking" to enable location services and view your
              position on the map.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}
