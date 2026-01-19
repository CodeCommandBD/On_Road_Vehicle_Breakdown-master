"use client";

import { useState } from "react";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  MapPin,
  Star,
  Clock,
  Phone,
  Share2,
  Heart,
  ChevronLeft,
  Wrench,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  selectUser,
  selectFavorites,
  toggleFavoriteSuccess,
} from "@/store/slices/authSlice";
import { useTranslations } from "next-intl";

export default function GarageDetailsClient({ garage, id }) {
  const t = useTranslations("GarageDetails");
  const tServices = useTranslations("Home.serviceNames");
  const router = useRouterWithLoading(); // Regular routing
  const user = useSelector(selectUser);
  const favorites = useSelector(selectFavorites);
  const dispatch = useDispatch();

  const isFavorite = favorites.some((f) => (f._id || f) === id);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error("Please login to save favorites");
      router.push("/login?callbackUrl=" + window.location.pathname);
      return;
    }

    try {
      const res = await axiosInstance.post("/user/favorites", { garageId: id });
      if (res.data.success) {
        const payload = isFavorite ? id : garage;
        dispatch(toggleFavoriteSuccess(payload));
        toast.success(
          isFavorite ? "Removed from favorites" : "Added to favorites",
        );
      }
    } catch (err) {
      toast.error("Failed to update favorites");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: garage.name,
      text: `${garage.name} - ${garage.address?.city}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleBookNow = () => {
    const bookingUrl = `/book?garage=${garage._id}`;
    if (!user) {
      toast.info(t("loginRequired") || "Please login to book a service");
      router.push(`/login?redirect=${encodeURIComponent(bookingUrl)}`);
    } else {
      router.push(bookingUrl);
    }
  };

  if (!garage) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            {t("unavailable")}
          </h1>
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
    <div className="min-h-screen bg-[#111] text-white pb-24 font-sans">
      {/* Hero Header */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full">
        {garage.images?.[0] ? (
          <Image
            src={garage.images[0].url}
            alt={garage.name}
            fill
            className="object-cover"
            priority // Load hero image immediately (LCP optimization)
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            quality={90}
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
              className="absolute top-6 left-4 md:left-10 px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg text-sm font-bold hover:bg-black/60 transition-all flex items-center gap-2 z-10 border border-white/10"
            >
              <ChevronLeft size={16} /> {t("back")}
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded border ${
                      garage.is24Hours
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-white/10 text-white/60 border-white/10"
                    }`}
                  >
                    {garage.is24Hours ? t("open247") : t("standardHours")}
                  </span>
                  {garage.isVerified && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded bg-orange-500 text-white flex items-center gap-1 shadow-lg shadow-orange-500/20">
                      <ShieldCheck size={12} /> {t("verified")}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-2 text-white drop-shadow-lg tracking-tight">
                  {garage.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-white/90">
                  <div className="flex items-center gap-1.5 text-orange-500 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5">
                    <Star className="w-4 h-4 fill-orange-500" />
                    <span className="font-bold text-white">
                      {garage.rating?.average || "5.0"}
                    </span>
                    <span className="text-white/40 text-xs">
                      ({garage.rating?.count || 0} {t("reviews")})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    <span className="font-medium">
                      {garage.address?.street}, {garage.address?.city}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={toggleFavorite}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    isFavorite
                      ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30"
                      : "bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 text-white"
                  }`}
                  title={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <Heart
                    className={`w-5 h-5 ${isFavorite ? "fill-white" : ""}`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="p-3.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 text-white transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-10 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          {/* About */}
          <section className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Wrench className="w-32 h-32" />
            </div>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-white tracking-tight">
              <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
              {t("about")}
            </h2>
            <p className="text-gray-400 leading-relaxed whitespace-pre-wrap text-lg font-medium">
              {garage.description || t("noDescription")}
            </p>
          </section>

          {/* Services */}
          <section className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-sm">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-white tracking-tight">
              <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
              {t("servicesOffered")}
            </h2>
            {garage.services && garage.services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {garage.services.map((service, index) => (
                  <div
                    key={index}
                    className="group flex items-start gap-4 p-5 bg-white/[0.05] rounded-2xl border border-white/5 hover:border-orange-500/50 hover:bg-white/[0.08] transition-all duration-300"
                  >
                    <div className="p-3 bg-orange-500/10 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                      <Wrench className="w-6 h-6 text-orange-500 group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">
                        {tServices(service.name, { default: service.name })}
                      </h3>
                      <p className="text-sm text-gray-500 font-medium">
                        {service.category || t("generalRepair")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic font-medium">
                {t("noServices")}
              </p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <aside className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 sticky top-28 backdrop-blur-sm shadow-2xl">
            <div className="mb-8">
              <h3 className="text-xl font-black mb-6 text-white tracking-tight">
                {t("contactInfo")}
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
                    <Clock className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-400 mb-1">
                      {t("operatingHours")}
                    </p>
                    <p className="text-base text-white font-semibold">
                      {garage.is24Hours ? t("open247Full") : t("standardTime")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
                    <Phone className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-400 mb-1">
                      {t("phone")}
                    </p>
                    <a
                      href={`tel:${garage.phone}`}
                      className="text-base text-orange-500 hover:text-orange-400 font-bold tracking-wide transition-colors"
                    >
                      {garage.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
                    <MapPin className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-400 mb-1">
                      {t("address")}
                    </p>
                    <p className="text-base text-white font-semibold leading-relaxed">
                      {garage.address?.street}, {garage.address?.city}
                      <br />
                      <span className="text-sm text-gray-500">
                        {garage.address?.district}, {garage.address?.postalCode}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleBookNow}
              className="block w-full py-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl font-black text-center shadow-xl shadow-orange-500/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-lg uppercase tracking-wider"
            >
              {t("bookNow")}
            </button>
            <div className="flex items-center justify-center gap-2 mt-4 text-gray-500">
              <ShieldCheck size={14} className="text-green-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-[10px]">
                {t("guarantee")}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
