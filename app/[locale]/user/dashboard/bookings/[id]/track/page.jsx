"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, Truck, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import L from "leaflet";
import { toast } from "react-toastify";

// Dynamically import MapComponent with no SSR
const MapComponent = dynamic(() => import("@/components/maps/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-white/5 animate-pulse rounded-xl flex items-center justify-center">
      <p className="text-white/40">Loading Map...</p>
    </div>
  ),
});

export default function UserTrackPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchTrackingData = async () => {
    try {
      const res = await fetch(`/api/bookings/${id}`);
      const data = await res.json();
      if (data.success) {
        console.log("Track Page Booking Data:", data.booking);
        console.log("Driver Location:", data.booking?.driverLocation);
        setBooking(data.booking);
        if (data.booking.driverLocation?.updatedAt) {
          setLastUpdated(new Date(data.booking.driverLocation.updatedAt));
        }
      }
    } catch (error) {
      console.error("Fetch tracking error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Poll every 5 seconds
  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const getMarkers = () => {
    if (!booking) return [];

    const markers = [];

    // User Location (Destination/Pickup)
    if (booking.location?.coordinates) {
      const userIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          <div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });

      markers.push({
        lat: booking.location.coordinates[1],
        lng: booking.location.coordinates[0],
        content: "My Vehicle (Pickup Log)",
        icon: userIcon,
      });
    }

    // Driver Location
    if (booking.driverLocation?.lat) {
      // Determine Vehicle Type
      const isTowing =
        booking.service?.category === "towing" || booking.towingRequested;

      const vehicleIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: ${
          isTowing ? "#ef4444" : "#3b82f6"
        }; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <span style="font-size: 20px;">${isTowing ? "🚚" : "🚗"}</span>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });

      markers.push({
        lat: booking.driverLocation.lat,
        lng: booking.driverLocation.lng,
        content: `Driver (${isTowing ? "Tow Truck" : "Service Car"})`,
        icon: vehicleIcon,
      });
    }

    return markers;
  };

  const markers = getMarkers();
  const polylines = [];

  if (booking?.driverLocation?.lat && booking?.location?.coordinates) {
    polylines.push({
      positions: [
        [booking.driverLocation.lat, booking.driverLocation.lng],
        [booking.location.coordinates[1], booking.location.coordinates[0]],
      ],
      color: "#3b82f6",
      dashArray: "10, 10", // Dashed line
    });
  }

  const center =
    markers.length > 0
      ? [
          booking.driverLocation?.lat || booking.location?.coordinates[1],
          booking.driverLocation?.lng || booking.location?.coordinates[0],
        ]
      : [23.8103, 90.4125]; // Default Dhaka

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/user/dashboard/bookings/${id}`}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-orange-500" />
              Track Your Rescue
            </h1>
            <p className="text-white/60 text-sm">
              Real-time updates from your tow truck
            </p>
          </div>
        </div>

        {lastUpdated && (
          <div className="text-right hidden sm:block">
            <p className="text-orange-500 font-bold text-sm flex items-center justify-end gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Live Updates
            </p>
            <p className="text-white/40 text-xs">
              Last update: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>

      {/* Map View */}
      <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl overflow-hidden shadow-xl p-1 relative">
        <MapComponent
          center={center}
          zoom={13}
          markers={markers}
          polylines={polylines}
          className="h-[600px] w-full rounded-xl"
        />

        {/* Helper Badge */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl space-y-3 z-[400]">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-white text-sm">Your Location</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-white text-sm">Tow Truck</span>
          </div>
          {!booking?.driverLocation && (
            <div className="pt-2 border-t border-white/10 mt-2">
              <p className="text-orange-500 text-xs text-center flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Waiting for driver signal...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
