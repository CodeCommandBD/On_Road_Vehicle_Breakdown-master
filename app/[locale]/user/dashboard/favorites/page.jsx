"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectFavorites,
  toggleFavoriteSuccess,
} from "@/store/slices/authSlice";
import {
  Heart,
  MapPin,
  Star,
  Search,
  Loader2,
  ChevronLeft,
  X,
  Wrench,
  Navigation,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import axios from "axios";
import { toast } from "react-toastify";

export default function FavoritesPage() {
  const user = useSelector(selectUser);
  const favorites = useSelector(selectFavorites);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const dashboardLink =
    user?.role === "admin"
      ? "/admin/dashboard"
      : user?.role === "garage" ||
        user?.membershipTier === "garage_pro" ||
        user?.membershipTier === "garage_basic"
      ? "/garage/dashboard"
      : user?.role === "mechanic"
      ? "/mechanic/dashboard"
      : "/user/dashboard";

  useEffect(() => {
    const hasOnlyIds = favorites.some((fav) => typeof fav === "string");
    if (hasOnlyIds && !loading) {
      fetchFullFavorites();
    }
  }, [favorites]);

  const fetchFullFavorites = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching favorites...");

      const res = await axios.get("/api/user/favorites");

      console.log("✅ Favorites response:", res.data);

      if (res.data.success) {
        dispatch({
          type: "auth/updateUser",
          payload: { favoriteGarages: res.data.favorites },
        });
      }
    } catch (error) {
      console.error("❌ Failed to fetch full favorites:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Show user-friendly error
      if (error.response?.status === 404) {
        toast.error("User not found. Please try logging in again.");
      } else if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        // Optionally redirect to login
      } else {
        toast.error("Failed to load favorites. Please refresh the page.");
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (garageId) => {
    try {
      const res = await axios.post("/api/user/favorites", { garageId });
      if (res.data.success) {
        dispatch(toggleFavoriteSuccess(garageId));
        toast.success("Removed from favorites");
      }
    } catch (error) {
      toast.error("Failed to remove favorite");
    }
  };

  const filteredFavorites = favorites.filter((garage) => {
    if (!garage || typeof garage !== "object") return false;
    return (
      garage.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      garage.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href={dashboardLink}
            className="text-xs text-white/40 hover:text-orange-400 transition-colors flex items-center gap-1 mb-2 group"
          >
            <ChevronLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            Favorite Garages
          </h1>
          <p className="text-white/60 mt-1">
            Re-visit your trusted service centers and quick-book assistance
          </p>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="bg-[#1E1E1E] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search favorites by name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          <span className="text-white font-bold">{favorites.length}</span>
          <span className="text-white/40 text-sm">Saved</span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
          <p className="text-white/60">Loading your favorites...</p>
        </div>
      ) : filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((garage) => (
            <div
              key={garage._id || garage}
              className="bg-[#1E1E1E] border border-white/10 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all group flex flex-col h-full"
            >
              {/* Image Header */}
              <div className="h-32 bg-gray-100 relative overflow-hidden">
                {garage.images?.[0] ? (
                  <img
                    src={garage.images[0].url}
                    alt={garage.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-950 flex items-center justify-center">
                    <Wrench className="w-12 h-12 text-white/10" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => removeFavorite(garage._id)}
                    className="p-2 bg-black/40 backdrop-blur-md text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-lg"
                    title="Remove from favorites"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {garage.isVerified && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
                    <Navigation size={10} /> VERIFIED
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white text-lg line-clamp-1">
                    {garage.name}
                  </h3>
                  <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded text-xs font-bold">
                    <Star className="w-3 h-3 fill-yellow-500" />
                    <span>{garage.rating?.average || "5.0"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="line-clamp-1">
                    {garage.address?.street}, {garage.address?.city}
                  </span>
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex gap-2">
                    <a
                      href={`tel:${garage.phone}`}
                      className="flex-1 py-2 rounded-xl bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 hover:bg-green-500 hover:text-white transition-all text-center"
                    >
                      Call Now
                    </a>
                    <Link
                      href={`/garages/${garage._id}`}
                      className="flex-1 py-2 rounded-xl bg-white/5 text-white/60 text-xs font-bold border border-white/5 hover:bg-white/10 hover:text-white transition-all text-center"
                    >
                      View Profile
                    </Link>
                  </div>
                  <Link
                    href={`/book?garage=${garage._id}`}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 transition-all"
                  >
                    Quick Book Assistance
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-[#1E1E1E] border border-2 border-dashed border-white/10 rounded-3xl text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {searchTerm ? "No Match Found" : "No Favorites Yet"}
          </h2>
          <p className="text-white/60 max-w-sm mb-8">
            {searchTerm
              ? "We couldn't find any favorite garages matching your search terms."
              : "Save your favorite service centers to quickly access them in emergencies."}
          </p>
          <Link
            href="/garages"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-glow-orange transition-all"
          >
            Explore Garages
          </Link>
        </div>
      )}
    </div>
  );
}
