"use client";

import {
  MapPin,
  Star,
  Clock,
  Navigation,
  Phone,
  LocateFixed,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";

// Dynamically import MapComponent to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/maps/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-white/5 animate-pulse rounded-xl flex items-center justify-center">
      <p className="text-white/40">Initializing Map...</p>
    </div>
  ),
});

export default function LiveGarageTracker() {
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]); // Dhaka default

  const fetchNearbyGarages = useCallback(async (lat, lng) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/garages?lat=${lat}&lng=${lng}&distance=15000&isActive=true`
      );
      if (response.data.success) {
        setGarages(response.data.data.garages);
      }
    } catch (error) {
      console.error("Error fetching nearby garages:", error);
      toast.error("Failed to find nearby garages");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.info("Updating location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setMapCenter([latitude, longitude]);
        fetchNearbyGarages(latitude, longitude);
        toast.success("Location updated!");
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Could not get your location. Please check permissions.");
        // Fallback to default if location fails
        fetchNearbyGarages(23.8103, 90.4125);
      }
    );
  };

  useEffect(() => {
    // Initial fetch with default location or detect if possible
    handleUpdateLocation();
  }, [fetchNearbyGarages]);

  const getStatusConfig = (status) => {
    const configs = {
      available: {
        label: "Available",
        dotColor: "bg-green-500",
        textColor: "text-green-400",
        bgColor: "bg-green-500/20",
      },
      busy: {
        label: "Busy",
        dotColor: "bg-yellow-500",
        textColor: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
      },
      closed: {
        label: "Closed",
        dotColor: "bg-gray-500",
        textColor: "text-gray-400",
        bgColor: "bg-gray-500/20",
      },
    };
    return configs[status] || configs.available;
  };

  const mapMarkers = garages.map((g) => ({
    lat: g.location.coordinates[1],
    lng: g.location.coordinates[0],
    content: (
      <div>
        <h3 className="font-bold">{g.name}</h3>
        <p className="text-xs">{g.address.street}</p>
        <p className="text-xs font-semibold text-orange-600">
          {g.rating.average} ⭐
        </p>
      </div>
    ),
  }));

  // Add user marker if available
  if (userLocation) {
    mapMarkers.push({
      lat: userLocation.lat,
      lng: userLocation.lng,
      content: "Your Location",
      // You could add a custom icon here later
    });
  }

  return (
    <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl overflow-hidden fade-in">
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-400" />
            Nearby Help Centers
          </h3>
          <button
            onClick={handleUpdateLocation}
            className="text-sm text-orange-400 hover:text-orange-300 transition flex items-center gap-1 bg-orange-400/10 px-3 py-1.5 rounded-full"
          >
            <Navigation className="w-4 h-4" />
            Update Location
          </button>
        </div>

        {/* Map Header Info */}
        {userLocation && (
          <div className="flex items-center gap-2 text-xs text-white/40 mb-4 px-1">
            <LocateFixed size={12} className="text-green-500" />
            <span>Showing garages within 15km of your location</span>
          </div>
        )}
      </div>

      {/* Map Integration */}
      <div className="px-6 mb-4">
        <MapComponent
          center={mapCenter}
          zoom={13}
          markers={mapMarkers}
          className="h-[300px] w-full rounded-xl border border-white/5"
        />
      </div>

      <div className="p-6 pt-2 h-[400px] overflow-y-auto custom-scrollbar">
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-white/5 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : garages.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-white/40 italic">
                No garages found in your area.
              </p>
            </div>
          ) : (
            garages.map((garage, index) => {
              const statusConfig = getStatusConfig(
                garage.isActive ? "available" : "closed"
              );

              return (
                <div
                  key={garage._id}
                  className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10 group cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-semibold group-hover:text-orange-400 transition-colors">
                          {garage.name}
                        </h4>
                        <div
                          className={`w-2 h-2 ${statusConfig.dotColor} rounded-full pulse-dot`}
                        ></div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-white/60 mb-3">
                        <span className="flex items-center gap-1 group-hover:text-white/90 transition-colors">
                          <Navigation className="w-3 h-3 text-orange-400" />
                          {garage.address.city}, {garage.address.district}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {garage.rating.average} ({garage.rating.count})
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig.bgColor} ${statusConfig.textColor}`}
                        >
                          {statusConfig.label}
                        </span>
                        <button className="px-3 py-1 bg-white/10 hover:bg-orange-500 text-white text-[11px] font-bold rounded-lg transition-all">
                          Details
                        </button>
                      </div>
                    </div>

                    <a
                      href={`tel:${garage.phone}`}
                      className="p-2.5 bg-white/5 hover:bg-green-500/20 rounded-xl transition-all border border-white/5 hover:border-green-500/20"
                    >
                      <Phone className="w-4 h-4 text-green-500" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="p-4 bg-white/5 border-t border-white/5 text-center">
        <button className="text-xs text-white/40 hover:text-white/90 transition-colors">
          View Detailed Availability Map →
        </button>
      </div>
    </div>
  );
}
