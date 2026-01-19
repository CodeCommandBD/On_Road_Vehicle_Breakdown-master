"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Wrench,
  ShieldCheck,
  Navigation,
  Heart,
  Filter,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectFavorites,
  toggleFavoriteSuccess,
} from "@/store/slices/authSlice";
import { useTranslations } from "next-intl";
import AdvancedSearch from "@/components/search/AdvancedSearch";
import FilterPanel from "@/components/search/FilterPanel";
import Image from "next/image";
import { commonImageProps } from "@/lib/utils/imageOptimization";

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
  const t = useTranslations("Garages");
  const searchParams = useSearchParams();
  const router = useRouterWithLoading(); // Regular routing
  const pathname = usePathname();

  // const [garages, setGarages] = useState([]); // Removed redundant state
  // const [total, setTotal] = useState(0); // Removed redundant state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Advanced Filter states
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    is24Hours: searchParams.get("is24Hours") === "true",
    isVerified: searchParams.get("isVerified") === "true",
    service: searchParams.get("service") || null,
    minRating: parseInt(searchParams.get("minRating")) || 0,
    openNow: searchParams.get("openNow") === "true",
    priceRange: [
      parseInt(searchParams.get("minPrice")) || 0,
      parseInt(searchParams.get("maxPrice")) || 5000,
    ],
  });

  const [coordinates, setCoordinates] = useState(null);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const favorites = useSelector(selectFavorites);

  // Debounce search and filter updates
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGarages();
    }, 500);

    return () => clearTimeout(timer);
  }, [filters, coordinates]);

  const handleSearch = (query) => {
    setFilters((prev) => ({ ...prev, search: query }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const fetchGaragesQuery = async () => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.is24Hours) params.append("is24Hours", "true");
    if (filters.isVerified) params.append("isVerified", "true");
    if (filters.openNow) params.append("openNow", "true");
    if (filters.service) params.append("service", filters.service);
    if (filters.minRating > 0)
      params.append("minRating", filters.minRating.toString());
    if (filters.priceRange[0] > 0)
      params.append("minPrice", filters.priceRange[0].toString());
    if (filters.priceRange[1] < 5000)
      params.append("maxPrice", filters.priceRange[1].toString());

    params.append("isActive", "true");

    if (coordinates) {
      params.append("lat", coordinates.lat);
      params.append("lng", coordinates.lng);
      params.append("distance", "10000"); // 10km radius default
    }

    // Update URL without refresh
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });

    const response = await axiosInstance.get(`/garages?${params.toString()}`);
    return response.data;
  };

  const { data: garagesData, isLoading: loading } = useQuery({
    queryKey: ["garages", filters, coordinates],
    queryFn: fetchGaragesQuery,
    keepPreviousData: true,
  });

  const garages = garagesData?.data?.garages || [];
  const total = garagesData?.data?.total || 0;

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Unable to retrieve your location");
      },
    );
  };

  const toggleFavorite = async (garageId) => {
    if (!user) {
      toast.error("Please login to favorite garages");
      router.push("/login?callbackUrl=" + window.location.pathname);
      return;
    }

    try {
      const response = await axiosInstance.post("/api/user/favorites", {
        garageId,
      });
      if (response.data.success) {
        const garageObj = garages.find((g) => g._id === garageId);
        dispatch(toggleFavoriteSuccess(garageObj || garageId));
        toast.success(
          favorites.some((f) => (f._id || f) === garageId)
            ? "Removed from favorites"
            : "Added to favorites",
        );
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorites");
    }
  };

  const handleBookNow = (garageId) => {
    const bookingUrl = `/book?garage=${garageId}`;
    if (!user) {
      toast.info(t("loginRequired") || "Please login to book a service");
      router.push(`/login?redirect=${encodeURIComponent(bookingUrl)}`);
    } else {
      router.push(bookingUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Advanced Search */}
      <div className="bg-gray-900 text-white py-12 mb-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <h1 className="text-3xl font-bold mb-6 text-center">{t("title")}</h1>

          <AdvancedSearch
            onSearch={handleSearch}
            initialQuery={filters.search}
          />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-gray-900 rounded-xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Filter className="w-5 h-5 text-orange-500" />
                  {t("filters")}
                </h2>
              </div>
              <FilterPanel
                filters={filters}
                onChange={handleFilterChange}
                className="space-y-6"
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="w-full bg-gray-900 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium"
              >
                <Filter className="w-4 h-4" />
                {showMobileFilters ? "Hide Filters" : "Show Advanced Filters"}
              </button>
            </div>

            {/* Mobile Filters Panel */}
            {showMobileFilters && (
              <div className="lg:hidden bg-gray-900 rounded-xl p-6 mb-6">
                <FilterPanel
                  filters={filters}
                  onChange={handleFilterChange}
                  className="space-y-6"
                />
              </div>
            )}

            {/* Controls Bar */}
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border">
              <p className="text-gray-600">
                {t("showing")} <strong>{loading ? "..." : total}</strong>{" "}
                {t("garages")}
              </p>
              <button
                onClick={handleNearMe}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  coordinates
                    ? "bg-blue-50/50 border-blue-500 text-blue-600 shadow-md"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Navigation className="w-4 h-4" />
                {coordinates ? t("nearMeActive") : t("nearMe")}
              </button>
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
                      <div className="w-48 h-36 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Wrench className="w-12 h-12 text-gray-300 animate-spin" />
                      </div>
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
                    {t("noGaragesFound")}
                  </h3>
                  <p className="text-gray-500">{t("tryAdjusting")}</p>
                </div>
              ) : (
                garages.map((garage) => (
                  <div
                    key={garage._id}
                    className="bg-white rounded-xl p-4 md:p-6 shadow-sm border flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow group relative"
                  >
                    {/* Image */}
                    <div className="w-full md:w-48 h-48 md:h-auto bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                      {garage.garageImages?.frontView ||
                      garage.images?.[0]?.url ? (
                        <Image
                          src={
                            garage.garageImages?.frontView ||
                            garage.images?.[0]?.url
                          }
                          alt={garage.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 192px"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          {...commonImageProps}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white/20">
                          <Wrench className="w-12 h-12" />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(garage._id);
                        }}
                        className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all z-10 ${
                          favorites.some((f) => (f._id || f) === garage._id)
                            ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                            : "bg-black/20 text-white hover:bg-white/20"
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            favorites.some((f) => (f._id || f) === garage._id)
                              ? "fill-current"
                              : ""
                          }`}
                        />
                      </button>
                      {garage.is24Hours && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10">
                          {t("open24/7")}
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
                              <div className="group/tooltip relative">
                                <ShieldCheck className="w-5 h-5 text-blue-500 fill-blue-500/10" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  {t("verifiedGarage")}
                                </div>
                              </div>
                            )}
                          </h3>
                          <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            {garage.address?.street}, {garage.address?.city}
                          </div>

                          {coordinates && garage.location?.coordinates && (
                            <div className="flex items-center gap-1 text-blue-600 text-sm font-medium bg-blue-50 w-fit px-2 py-0.5 rounded border border-blue-100">
                              <Navigation className="w-3 h-3 fill-blue-600" />
                              {calculateDistance(
                                coordinates.lat,
                                coordinates.lng,
                                garage.location.coordinates[1], // Latitude
                                garage.location.coordinates[0], // Longitude
                              )}{" "}
                              {t("kmAway")}
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
                            {t("noServices")}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-auto">
                        <button
                          onClick={() => handleBookNow(garage._id)}
                          className="flex-1 text-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
                        >
                          {t("bookNow")}
                        </button>
                        <Link
                          href={`/garages/${garage._id}`}
                          className="flex-1 text-center px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                          {t("viewProfile")}
                        </Link>
                        <a
                          href={`tel:${garage.phone}`}
                          className="p-2.5 bg-green-50 text-green-600 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors"
                          title={t("callGarage")}
                        >
                          <Phone className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
