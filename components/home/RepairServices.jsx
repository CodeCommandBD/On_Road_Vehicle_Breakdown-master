"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import ServiceCard from "./ServiceCard";
import { Wrench } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

export default function RepairServices() {
  const t = useTranslations("Home.services");
  const [activeTab, setActiveTab] = useState("cars");
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();

  const { data: services = [], isLoading: loading } = useQuery({
    queryKey: ["homepageServices"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        "/api/services?isActive=true&limit=12&sort=order",
      );
      return response.data.services || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // For now, mapping same services to both or just cars as requested.
  // User said "only for cars". We can leave bikes empty or static for now,
  // or just show the same services if they apply to both.
  // Attempting to filter or just use the fetched list for Cars.
  const currentServices = activeTab === "cars" ? services : [];

  return (
    <section
      id="services"
      className="py-16 sm:py-20 md:py-24 lg:py-28 bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section - Centered */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Icon & Label */}
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <svg
              className="w-3 h-3 animate-[spin_8s_linear_infinite]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M0 9.11058C0.119355 9.72495 0.198523 10.0225 0.769556 10.7789C1.22733 11.224 2.10196 11.9136 2.86037 11.9651C2.29231 12.2918 0.220829 10.2473 0 9.11058Z"
                fill="#FF6644"
              />
              <path
                d="M6.95329 7.88544C8.29113 8.2351 9.77255 7.89161 10.821 6.846C12.0012 5.67073 12.2951 3.94825 11.7039 2.49909L9.72188 4.47471L7.97807 4.01223L7.51016 2.27123L9.49271 0.295053C8.03944 -0.294262 6.3114 -0.0007267 5.13177 1.1751C4.08335 2.22071 3.73875 3.69681 4.09067 5.03315L0 9.11058C0.119355 9.72495 0.198523 10.0225 0.769556 10.7789C1.22733 11.224 2.10196 11.9136 2.86037 11.9651L6.95329 7.88544Z"
                fill="#FF6644"
              />
            </svg>
            <h5 className="text-orange-600 text-xs font-semibold tracking-widest uppercase">
              Repair Services
            </h5>
          </div>

          {/* Title with Scroll Animation */}
          <h2
            ref={titleRef}
            className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900 transition-all duration-1000 ease-out ${
              titleVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-12"
            }`}
          >
            {t("title")} <br className="hidden sm:block" />
            {t("subtitle")}
          </h2>
        </div>

        {/* Tabs - Centered */}
        <div className="flex justify-center gap-8 sm:gap-12 md:gap-16 mb-10 sm:mb-14">
          <button
            className={`relative bg-transparent text-xl sm:text-2xl md:text-3xl font-semibold tracking-wide py-2 transition-all duration-300 ${
              activeTab === "cars"
                ? "text-orange-600"
                : "text-gray-400 hover:text-orange-600"
            }`}
            onClick={() => setActiveTab("cars")}
          >
            {t("cars")}
            <span
              className={`absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 transition-all duration-300 ${
                activeTab === "cars" ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>

          <button
            className={`relative bg-transparent text-xl sm:text-2xl md:text-3xl font-semibold tracking-wide py-2 transition-all duration-300 ${
              activeTab === "bikes"
                ? "text-orange-600"
                : "text-gray-400 hover:text-orange-600"
            }`}
            onClick={() => setActiveTab("bikes")}
          >
            {t("bikes")}
            <span
              className={`absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 transition-all duration-300 ${
                activeTab === "bikes" ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>
        </div>

        {/* Services Grid - Centered */}
        {activeTab === "cars" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5 md:gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-12">
                <Wrench className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : currentServices.length > 0 ? (
              currentServices.map((service, index) => (
                <ServiceCard
                  key={`${activeTab}-${service._id || index}`}
                  icon={service.image || "/images/nav-one.webp"}
                  title={service.name}
                  link={`/garages?service=${service.slug}`}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No services found for {activeTab}.
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="w-24 h-24 mb-6 relative opacity-30 grayscale">
              <Image
                src="/images/nav-one.webp"
                alt="Coming Soon"
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Coming Soon!
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We are working hard to bring Bike Repair services to our platform.
              Checks back soon!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
