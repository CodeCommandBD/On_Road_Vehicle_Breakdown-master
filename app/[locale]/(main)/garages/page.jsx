"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  MapPin,
  Search,
  Filter,
  Clock,
  Phone,
  Wrench,
  Loader2,
  ShieldCheck,
  Navigation,
} from "lucide-react";
import axios from "axios";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Haversine formula to calculate distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d.toFixed(1);
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

export default function GaragesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [filter24h, setFilter24h] = useState(
    searchParams.get("is24Hours") === "true"
  );
  const [filterService, setFilterService] = useState(
    searchParams.get("service") || null
  );

  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGarages();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, filter24h, filterService, userLocation]);

  const fetchGarages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filter24h) params.append("is24Hours", "true");
      if (filterService) params.append("service", filterService);
      params.append("isActive", "true"); // Always show active only

      if (userLocation) {
        params.append("lat", userLocation.lat);
        params.append("lng", userLocation.lng);
        params.append("distance", "10000"); // 10km radius default
      }

      // Update URL without refresh
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      const response = await axios.get(`/api/garages?${params.toString()}`);

      if (response.data.success) {
        setGarages(response.data.data.garages);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch garages:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter24h = () => {
    setFilter24h((prev) => !prev);
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError("Unable to retrieve your location");
        setLoading(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gray-900 text-white py-16 mb-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Find Nearby Garages
          </h1>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto bg-white rounded-lg p-2 flex gap-2">
            <div className="flex-1 flex items-center gap-3 px-4 border-r">
              <MapPin className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, city, or district..."
                className="w-full py-2 outline-none text-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={fetchGarages}
              className="px-8 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Filters */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-600">
            Showing <strong>{loading ? "..." : total}</strong> garages
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleNearMe}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                userLocation
                  ? "bg-blue-50/50 border-blue-500 text-blue-600 shadow-md"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Navigation className="w-4 h-4" />
              {userLocation ? "Near Me (Active)" : "Near Me"}
            </button>
            <button
              onClick={toggleFilter24h}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                filter24h
                  ? "bg-orange-50/50 border-orange-500 text-orange-600"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Clock className="w-4 h-4" />
              24/7 Only
            </button>
            {filterService && (
              <button
                onClick={() => setFilterService(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-orange-50/50 border-orange-500 text-orange-600 hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors"
              >
                <Wrench className="w-4 h-4" />
                Service: {filterService} (x)
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>

        {/* Garages List */}
        <div className="space-y-4">
          {loading ? (
            // Loading Skeletons
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 shadow-sm border h-48 animate-pulse"
              >
                <div className="flex gap-6">
                  <div className="w-48 h-36 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : garages.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No garages found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            garages.map((garage) => (
              <div
                key={garage._id}
                className="bg-white rounded-xl p-4 md:p-6 shadow-sm border flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow group"
              >
                {/* Image */}
                <div className="w-full md:w-48 h-48 md:h-auto bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                  {garage.garageImages?.frontView || garage.images?.[0]?.url ? (
                    <img
                      src={
                        garage.garageImages?.frontView ||
                        garage.images?.[0]?.url
                      }
                      alt={garage.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white/20">
                      <Wrench className="w-12 h-12" />
                    </div>
                  )}

                  {garage.is24Hours && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                      OPEN 24/7
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-xl font-bold mb-1 text-gray-900 flex items-center gap-2">
                        {garage.name}
                        {garage.isVerified && (
                          <div className="group relative">
                            <ShieldCheck className="w-5 h-5 text-blue-500 fill-blue-500/10" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Verified Garage
                            </div>
                          </div>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        {garage.address?.street}, {garage.address?.city}
                      </div>

                      {userLocation && garage.location?.coordinates && (
                        <div className="flex items-center gap-1 text-blue-600 text-sm font-medium bg-blue-50 w-fit px-2 py-0.5 rounded border border-blue-100">
                          <Navigation className="w-3 h-3 fill-blue-600" />
                          {calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            garage.location.coordinates[1], // Latitude
                            garage.location.coordinates[0] // Longitude
                          )}{" "}
                          km away
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-gray-900">
                        {garage.rating?.average?.toFixed(1) || "5.0"}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({garage.rating?.count || 0})
                      </span>
                    </div>
                  </div>

                  {/* Specialties (Services) */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {garage.services && garage.services.length > 0 ? (
                      garage.services.slice(0, 5).map((service, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200"
                        >
                          {service.name || service}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        No specific services listed
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-auto">
                    <Link
                      href={`/book?garage=${garage._id}`}
                      className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
                    >
                      Book Now
                    </Link>
                    <a
                      href={`tel:${garage.phone}`}
                      className="p-2 border border-gray-200 rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors"
                      title="Call Garage"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <Link
                      href={`/garages/${garage._id}`}
                      className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium ml-auto"
                    >
                      View Profile
                    </Link>
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
