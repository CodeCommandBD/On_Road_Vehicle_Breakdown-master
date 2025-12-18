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
import axios from "axios";
import { toast } from "react-toastify";

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
  const user = useSelector(selectUser);
  const [allServices, setAllServices] = useState([]);
  const [garageProfile, setGarageProfile] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch all services and garage profile
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const [servicesRes, garageRes] = await Promise.all([
          axios.get("/api/services"),
          axios.get("/api/garages/profile"),
        ]);

        if (servicesRes.data.success) {
          // Handle both response formats
          const services =
            servicesRes.data.data?.services || servicesRes.data.services || [];
          setAllServices(services);
        }

        if (garageRes.data.success) {
          setGarageProfile(garageRes.data.garage);
          // Set initially selected services
          const serviceIds =
            garageRes.data.garage.services?.map((s) =>
              typeof s === "string" ? s : s._id
            ) || [];
          setSelectedServices(serviceIds);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load services");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Handle service toggle
  const toggleService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Save services
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await axios.put("/api/garages/services", {
        serviceIds: selectedServices,
      });

      if (response.data.success) {
        toast.success(
          `Services updated successfully! ${selectedServices.length} services selected`
        );
        // Update garage profile with new data
        setGarageProfile(response.data.garage);
      }
    } catch (error) {
      console.error("Error saving services:", error);
      toast.error(error.response?.data?.message || "Failed to update services");
    } finally {
      setIsSaving(false);
    }
  };

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
            Manage Services
          </h1>
          <p className="text-white/60">
            Select the services your garage offers to customers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-white/60 text-sm">Selected: </span>
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
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Save Services
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
            placeholder="Search services..."
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
          <p className="text-white/60">No services found</p>
          <p className="text-white/40 text-sm mt-2">
            Try adjusting your search or filter
          </p>
        </div>
      )}

      {/* Results count */}
      <div className="text-center text-white/40 text-sm">
        Showing {filteredServices.length} of {allServices?.length || 0} services
      </div>
    </div>
  );
}
