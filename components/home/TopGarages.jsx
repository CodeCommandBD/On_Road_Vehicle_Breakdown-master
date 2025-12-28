"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useTranslations } from "next-intl";

export default function TopGarages() {
  const t = useTranslations("Home.topGarages");
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scroll animations
  const headerAnimation = useScrollAnimation({ threshold: 0.2 });

  useEffect(() => {
    fetchTopGarages();
  }, []);

  const fetchTopGarages = async () => {
    try {
      const response = await fetch(
        "/api/garages?limit=3&sort=rating&isActive=true&isVerified=true"
      );
      const data = await response.json();
      if (data.success) {
        setGarages(data.data.garages || []);
      }
    } catch (error) {
      console.error("Failed to fetch garages:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-b from-gray-900 to-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header - Centered */}
        <div
          ref={headerAnimation.ref}
          className={`text-center mb-12 sm:mb-16 transition-all duration-1000 ${
            headerAnimation.isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <span className="inline-block text-orange-600 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3">
            TRUSTED PARTNERS
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            {t("title")}{" "}
            <span className="text-orange-600">{t("highlight")}</span>
          </h2>
        </div>

        {/* Garages Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-8 h-[380px] animate-pulse"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 mx-auto mb-6" />
                <div className="h-6 bg-gradient-to-r from-gray-700 to-gray-800 rounded w-4/5 mx-auto mb-3" />
                <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded w-3/5 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {garages.map((garage, index) => {
              // Garage logo emojis
              const logos = ["🏎️", "🚗", "🏁"];
              return (
                <Link
                  key={garage._id}
                  href={`/garages/${garage._id}`}
                  className="group relative bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8 text-center transition-all duration-500 ease-out cursor-pointer overflow-hidden hover:-translate-y-2 hover:border-orange-600/50 hover:bg-gray-800/90 hover:shadow-[0_20px_60px_rgba(255,83,45,0.3)]"
                >
                  {/* Top Border Hover Effect */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-orange-700 scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />

                  {/* Logo */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-600/20 to-orange-700/20 border-2 border-orange-600/30 text-4xl sm:text-5xl transition-all duration-500 group-hover:border-orange-600 group-hover:scale-110 group-hover:rotate-[360deg] group-hover:shadow-lg group-hover:shadow-orange-600/50">
                    {garage.logo || logos[index % 3]}
                  </div>

                  {/* Garage Name */}
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 transition-colors duration-300 group-hover:text-orange-500">
                    {garage.name}
                  </h3>

                  {/* Location */}
                  <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-5">
                    {garage.address?.city}, {garage.address?.district}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center justify-center gap-2 mb-5 sm:mb-6">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          className="text-orange-600 fill-orange-600 transition-transform duration-300 group-hover:scale-110"
                        />
                      ))}
                    </div>
                    <span className="text-base sm:text-lg font-semibold text-white">
                      {garage.rating?.average?.toFixed(1) || "5.0"}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400">
                      ({garage.rating?.count || 0})
                    </span>
                  </div>

                  {/* CTA Button */}
                  <span className="inline-block px-6 sm:px-9 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white text-sm sm:text-base font-semibold rounded-lg transition-all duration-300 shadow-lg group-hover:scale-105 group-hover:shadow-[0_8px_24px_rgba(255,83,45,0.5)]">
                    BOOK NOW
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
