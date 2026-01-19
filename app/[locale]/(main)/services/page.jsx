"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wrench,
  Battery,
  Truck,
  Key,
  Thermometer,
  Settings,
  Car,
  Hammer,
  Music,
  Droplet,
} from "lucide-react";
import { cn } from "@/lib/utils/helpers";
import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

const staticCategories = [
  { id: "all", label: "All Services" },
  { id: "engine", label: "Engine" },
  { id: "electrical", label: "Electrical" },
  { id: "body", label: "Body Work" },
  { id: "towing", label: "Towing" },
];

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["allServices"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/services?isActive=true");
      return res.data.services || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredServices = services.filter(
    (service) =>
      activeCategory === "all" || service.category === activeCategory,
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-primary text-white py-20 mb-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="max-w-2xl mx-auto text-white/90">
            Professional vehicle breakdown and maintenance services available
            24/7. Book online or call us for emergency assistance.
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {staticCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-6 py-2 rounded-full font-medium transition-all",
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-white text-gray-600 hover:bg-gray-100",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const IconComponent = service.icon || Wrench;
              return (
                <div
                  key={service._id}
                  className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-lg transition-all"
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-orange-100 text-orange-600`}
                  >
                    {typeof IconComponent === "string" ? (
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <IconComponent className="w-7 h-7" />
                    )}
                  </div>

                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{service.name}</h3>
                    <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      From {service.price || "৳500"}
                    </span>
                  </div>

                  <p className="text-muted text-sm mb-6">
                    {service.description}
                  </p>

                  <Link
                    href={`/book?service=${service.slug || service._id}`}
                    className="w-full btn btn-outline hover:bg-primary hover:text-white hover:border-primary"
                  >
                    Book Service
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {filteredServices.length === 0 && (
          <div className="text-center py-20 text-muted">
            No services found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
