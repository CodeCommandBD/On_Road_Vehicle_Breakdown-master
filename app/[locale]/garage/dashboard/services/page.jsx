"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import {
  Loader2,
  Search,
  CheckCircle2,
  Circle,
  Wrench,
  Zap,
  Car,
  Battery,
  Droplets,
  Gauge,
  Wind,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";

// Icon mapping for service categories
const categoryIcons = {
  engine: Gauge,
  electrical: Zap,
  tire: Car,
  battery: Battery,
  fuel: Droplets,
  towing: Wrench,
  lockout: Lock,
  ac: Wind,
  brake: AlertCircle,
  general: Wrench,
  other: Wrench,
};

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const t = useTranslations("Garage");
  const commonT = useTranslations("Common");
  const user = useSelector(selectUser);
  const [selectedServices, setSelectedServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch all services and garage profile
  const { data, isLoading } = useQuery({
    queryKey: ["garageServicesData"],
    queryFn: async () => {
      const [servicesRes, garageRes] = await Promise.all([
        axiosInstance.get("/api/services"),
        axiosInstance.get("/api/garages/profile"),
      ]);

      const services =
        servicesRes.data.data?.services || servicesRes.data.services || [];
      const garage = garageRes.data.garage;

      // Initialize selected services once
      const serviceIds =
        garage.services?.map((s) => (typeof s === "string" ? s : s._id)) || [];
      setSelectedServices(serviceIds);

      return { services, garage };
    },
    enabled: !!user,
  });

  const allServices = data?.services || [];
  const garageProfile = data?.garage;

  const saveMutation = useMutation({
    mutationFn: async (serviceIds) => {
      const res = await axiosInstance.put("/api/garages/services", {
        serviceIds,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Services updated successfully! ${selectedServices.length} services selected`,
      );
      queryClient.setQueryData(["garageServicesData"], (old) => ({
        ...old,
        garage: data.garage,
      }));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update services");
    },
  });

  const handleSave = () => {
    saveMutation.mutate(selectedServices);
  };

  const isSaving = saveMutation.isPending;

  // Filter services
  const filteredServices = (allServices || []).filter((service) => {
    const matchesSearch = service.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [
    "all",
    ...new Set((allServices || []).map((s) => s.category)),
  ];

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t("servicesTitle")}
          </h1>
          <p className="text-white/60">{t("missionDesc")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-white/60 text-sm">{commonT("status")}: </span>
            <span className="text-white font-bold text-lg">
              {selectedServices.length}
            </span>
            <span className="text-white/40 text-sm">
              {" "}
              / {allServices?.length || 0}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {commonT("loading")}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                {t("addService")}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder={commonT("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all"
                ? "All Categories"
                : cat.replace(/-/g, " ").toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => {
          const isSelected = selectedServices.includes(service._id);
          const IconComponent = categoryIcons[service.category] || Wrench;

          return (
            <button
              key={service._id}
              onClick={() => toggleService(service._id)}
              className={`relative p-5 rounded-2xl border-2 transition-all text-left group ${
                isSelected
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              {/* Selection Indicator */}
              <div className="absolute top-4 right-4">
                {isSelected ? (
                  <CheckCircle2 className="w-6 h-6 text-orange-500" />
                ) : (
                  <Circle className="w-6 h-6 text-white/20 group-hover:text-white/40" />
                )}
              </div>

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                  isSelected
                    ? "bg-orange-500/20"
                    : "bg-white/5 group-hover:bg-white/10"
                }`}
              >
                <IconComponent
                  className={`w-6 h-6 ${
                    isSelected ? "text-orange-500" : "text-white/60"
                  }`}
                />
              </div>

              {/* Content */}
              <h3 className="text-white font-bold text-lg mb-1">
                {service.name}
              </h3>
              {service.description && (
                <p className="text-white/60 text-sm mb-3 line-clamp-2">
                  {service.description}
                </p>
              )}

              {/* Details */}
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2 py-1 bg-white/5 rounded-lg text-white/60">
                  {service.category}
                </span>
                {service.basePrice && (
                  <span className="text-green-400 font-medium">
                    ৳{service.basePrice}
                  </span>
                )}
                {service.duration?.estimated && (
                  <span className="text-white/40">
                    ~{service.duration.estimated}min
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* No results */}
      {filteredServices.length === 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-12 text-center">
          <Wrench className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">{t("noServices")}</p>
          <p className="text-white/40 text-sm mt-2">{t("noServicesSub")}</p>
        </div>
      )}

      {/* Results count */}
      <div className="text-center text-white/40 text-sm">
        {t("showingServices", {
          count: filteredServices.length,
          total: allServices?.length || 0,
        })}
      </div>
    </div>
  );
}
