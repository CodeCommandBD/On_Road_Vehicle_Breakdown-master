"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, Truck, RefreshCw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import MapComponent with no SSR
const MapComponent = dynamic(() => import("@/components/maps/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-white/5 animate-pulse rounded-xl flex items-center justify-center">
      <p className="text-white/40">Loading Map...</p>
    </div>
  ),
});

export default function AdminTrackPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchTrackingData = async () => {
    try {
      const res = await fetch(`/api/bookings/${id}`);
      const data = await res.json();
      if (data.success) {
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

    // User Location
    if (booking.location?.coordinates) {
      markers.push({
        lat: booking.location.coordinates[1],
        lng: booking.location.coordinates[0],
        content: `User: ${booking.user?.name || "Customer"}`,
      });
    }

    // Driver Location
    if (booking.driverLocation?.lat) {
      markers.push({
        lat: booking.driverLocation.lat,
        lng: booking.driverLocation.lng,
        content: `Driver: ${booking.garage?.name || "Garage"}`,
      });
    }

    return markers;
  };

  const markers = getMarkers();
  const center =
    markers.length > 0
      ? [
          booking.driverLocation?.lat || booking.location?.coordinates[1],
          booking.driverLocation?.lng || booking.location?.coordinates[0],
        ]
      : [23.8103, 90.4125];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/bookings"
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-orange-500" />
              Admin Monitoring
            </h1>
            <p className="text-white/60 text-sm">
              Tracking Booking #{booking?.bookingNumber}
            </p>
          </div>
        </div>

        {lastUpdated && (
          <div className="text-right hidden sm:block">
            <p className="text-orange-500 font-bold text-sm flex items-center justify-end gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Live Feed
            </p>
            <p className="text-white/40 text-xs">
              Updated: {lastUpdated.toLocaleTimeString()}
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
          className="h-[600px] w-full rounded-xl"
        />

        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl space-y-2 z-[400]">
          <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-2 border-b border-white/10 pb-2">
            Legend
          </h4>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-white text-sm">Customer Location</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-white text-sm">Garage Driver</span>
          </div>
        </div>
      </div>
    </div>
  );
}
