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

const categories = [
  { id: "all", label: "All Services" },
  { id: "engine", label: "Engine" },
  { id: "electrical", label: "Electrical" },
  { id: "body", label: "Body Work" },
  { id: "towing", label: "Towing" },
];

const services = [
  {
    id: 1,
    title: "Engine Repair",
    category: "engine",
    description:
      "Complete engine diagnostics, repair, and rebuilding services.",
    price: "From ৳2000",
    icon: Settings,
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: 2,
    title: "Battery Replacement",
    category: "electrical",
    description: "New battery installation and old battery disposal service.",
    price: "From ৳500",
    icon: Battery,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: 3,
    title: "Flat Tire Change",
    category: "body",
    description: "Quick tire change service at your location.",
    price: "৳300",
    icon: Wrench,
    color: "bg-green-100 text-green-600",
  },
  {
    id: 4,
    title: "Emergency Towing",
    category: "towing",
    description: "24/7 towing service to nearest garage or preferred location.",
    price: "From ৳1500",
    icon: Truck,
    color: "bg-red-100 text-red-600",
  },
  {
    id: 5,
    title: "Car Lockout",
    category: "body",
    description: "Safe entry when keys are locked inside or lost.",
    price: "৳800",
    icon: Key,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: 6,
    title: "AC Service",
    category: "electrical",
    description: "AC gas refill, cleaning, and repair services.",
    price: "From ৳1000",
    icon: Thermometer,
    color: "bg-cyan-100 text-cyan-600",
  },
  {
    id: 7,
    title: "Oil Change",
    category: "engine",
    description: "Engine oil change with premium oil brands.",
    price: "From ৳1200",
    icon: Droplet,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    id: 8,
    title: "Car Wash",
    category: "body",
    description: "Premium car wash and interior cleaning.",
    price: "৳400",
    icon: Car,
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    id: 9,
    title: "Dent Paint",
    category: "body",
    description: "Scratch removal and full body painting service.",
    price: "Custom",
    icon: Hammer,
    color: "bg-pink-100 text-pink-600",
  },
];

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredServices = services.filter(
    (service) => activeCategory === "all" || service.category === activeCategory
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
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-6 py-2 rounded-full font-medium transition-all",
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-lg transition-all"
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${service.color}`}
              >
                <service.icon className="w-7 h-7" />
              </div>

              <div className="flex justify-between items-start mb-2">
                <h3 className="tex-xl font-bold">{service.title}</h3>
                <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                  {service.price}
                </span>
              </div>

              <p className="text-muted text-sm mb-6">{service.description}</p>

              <Link
                href={`/book?service=${service.id}`}
                className="w-full btn btn-outline hover:bg-primary hover:text-white hover:border-primary"
              >
                Book Service
              </Link>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-20 text-muted">
            No services found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
