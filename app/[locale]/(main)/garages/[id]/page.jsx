"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  MapPin,
  Star,
  Clock,
  Phone,
  Mail,
  Share2,
  Heart,
  ChevronLeft,
  Wrench,
  ShieldCheck,
  Navigation,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  selectUser,
  selectFavorites,
  toggleFavoriteSuccess,
} from "@/store/slices/authSlice";
import { useTranslations } from "next-intl";

export default function GarageDetailsPage() {
  const t = useTranslations("GarageDetails");
  const tServices = useTranslations("Home.serviceNames");
  const { id } = useParams();
  const router = useRouter();
  const user = useSelector(selectUser);
  const favorites = useSelector(selectFavorites);
  const dispatch = useDispatch();

  const [garage, setGarage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFavorite = favorites.some((f) => (f._id || f) === id);

  useEffect(() => {
    if (id) {
      fetchGarageDetails();
    }
  }, [id]);

  const fetchGarageDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/garages/${id}`);
      if (res.data.success) {
        setGarage(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching garage:", err);
      setError(t("errorLoading"));
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error("Please login to save favorites");
      router.push("/login?callbackUrl=" + window.location.pathname);
      return;
    }

    try {
      const res = await axios.post("/api/user/favorites", { garageId: id });
      if (res.data.success) {
        // Find full object to update Redux if we are adding, but here we can just pass ID
        // OR better: pass the garage object we have in state IF we are adding.
        // If removing, ID is enough.
        const payload = isFavorite ? id : garage;
        dispatch(toggleFavoriteSuccess(payload));

        toast.success(
          isFavorite ? "Removed from favorites" : "Added to favorites"
        );
      }
    } catch (err) {
      toast.error("Failed to update favorites");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center">
          <Wrench className="w-10 h-10 text-orange-500 mb-4 animate-spin" />
          <p>{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !garage) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            {t("unavailable")}
          </h1>
          <p className="text-white/60 mb-6">{error || t("errorLoading")}</p>
          <Link
            href="/garages"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all"
          >
            {t("browseAll")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white pb-24">
      {/* Hero Header */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full">
        {garage.images?.[0] ? (
          <img
            src={garage.images[0].url}
            alt={garage.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <Wrench className="w-24 h-24 text-white/5" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/50 to-transparent flex flex-col justify-end p-4 md:p-10">
          <div className="max-w-7xl mx-auto w-full">
            <Link
              href="/garages"
              className="absolute top-6 left-4 md:left-10 px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg text-sm font-bold hover:bg-black/60 transition-all flex items-center gap-2"
            >
              <ChevronLeft size={16} /> {t("back")}
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded border ${
                      garage.is24Hours
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-white/10 text-white/60 border-white/10"
                    }`}
                  >
                    {garage.is24Hours ? t("open247") : t("standardHours")}
                  </span>
                  {garage.isVerified && (
                    <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded bg-blue-500 text-white flex items-center gap-1">
                      <ShieldCheck size={12} /> {t("verified")}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold mb-2 text-white shadow-sm">
                  {garage.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-white/80">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-5 h-5 fill-yellow-500" />
                    <span className="font-bold text-white">
                      {garage.rating?.average || "5.0"}
                    </span>
                    <span className="text-white/40">
                      ({garage.rating?.count || 0} {t("reviews")})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span>
                      {garage.address?.street}, {garage.address?.city}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={toggleFavorite}
                  className={`p-3 rounded-xl border transition-all ${
                    isFavorite
                      ? "bg-red-500 border-red-500 text-white"
                      : "bg-white/10 border-white/10 hover:bg-white/20 text-white"
                  }`}
                  title={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <Heart
                    className={`w-6 h-6 ${isFavorite ? "fill-white" : ""}`}
                  />
                </button>
                <button className="p-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 text-white transition-all">
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-10 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Wrench className="hidden md:block w-5 h-5 text-orange-500" />
              {t("about")}
            </h2>
            <p className="text-white/70 leading-relaxed whitespace-pre-wrap">
              {garage.description || t("noDescription")}
            </p>
          </div>

          {/* Services */}
          <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold mb-6">{t("servicesOffered")}</h2>
            {garage.services && garage.services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {garage.services.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all"
                  >
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Wrench className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">
                        {tServices(service.name, { default: service.name })}
                      </h3>
                      <p className="text-sm text-white/50">
                        {service.category || t("generalRepair")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 italic">{t("noServices")}</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl p-6 sticky top-24">
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4">{t("contactInfo")}</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-white/40 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-white/80">
                      {t("operatingHours")}
                    </p>
                    <p className="text-sm text-white/50">
                      {garage.is24Hours ? t("open247Full") : t("standardTime")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-white/40 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-white/80">
                      {t("phone")}
                    </p>
                    <a
                      href={`tel:${garage.phone}`}
                      className="text-sm text-orange-400 hover:underline"
                    >
                      {garage.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-white/40 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-white/80">
                      {t("address")}
                    </p>
                    <p className="text-sm text-white/50">
                      {garage.address?.street}, {garage.address?.city}
                    </p>
                    <p className="text-sm text-white/50">
                      {garage.address?.district}, {garage.address?.postalCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href={`/book?garage=${garage._id}`}
              className="block w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-center shadow-lg shadow-orange-500/20 transition-all transform hover:scale-[1.02]"
            >
              {t("bookNow")}
            </Link>
            <p className="text-center text-xs text-white/30 mt-3">
              {t("guarantee")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
