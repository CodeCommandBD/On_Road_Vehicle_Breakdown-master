"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, MapPin, Search, Filter, Clock, Phone } from "lucide-react";

const garages = [
  {
    id: 1,
    name: "Auto Care Center",
    image: "/images/garage-1.jpg",
    rating: 4.9,
    reviews: 256,
    distance: "1.2 km",
    location: "Gulshan 1, Dhaka",
    specialties: ["Engine", "Electrical", "AC"],
    is24Hours: true,
  },
  {
    id: 2,
    name: "Quick Fix Garage",
    image: "/images/garage-2.jpg",
    rating: 4.8,
    reviews: 189,
    distance: "2.5 km",
    location: "Dhanmondi 27, Dhaka",
    specialties: ["Tire", "Battery", "Brake"],
    is24Hours: true,
  },
  {
    id: 3,
    name: "Pro Mechanics",
    image: "/images/garage-3.jpg",
    rating: 4.7,
    reviews: 312,
    distance: "3.8 km",
    location: "Agrabad, Chittagong",
    specialties: ["General", "Towing"],
    is24Hours: false,
  },
  {
    id: 4,
    name: "Bike Master",
    image: "/images/garage-4.jpg",
    rating: 4.6,
    reviews: 120,
    distance: "4.1 km",
    location: "Mirpur 10, Dhaka",
    specialties: ["Motorcycle", "Oil Change"],
    is24Hours: false,
  },
  {
    id: 5,
    name: "Sylhet Motors",
    image: "/images/garage-5.jpg",
    rating: 4.9,
    reviews: 89,
    distance: "5.5 km",
    location: "Zindabazar, Sylhet",
    specialties: ["Engine", "Body Work"],
    is24Hours: true,
  },
  {
    id: 6,
    name: "Khulna Car Point",
    image: "/images/garage-6.jpg",
    rating: 4.5,
    reviews: 156,
    distance: "0.8 km",
    location: "Sonadanga, Khulna",
    specialties: ["AC Service", "General"],
    is24Hours: false,
  },
];

export default function GaragesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter24h, setFilter24h] = useState(false);

  const filteredGarages = garages.filter((garage) => {
    const matchesSearch =
      garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      garage.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter24h ? garage.is24Hours : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gray-900 text-white py-16 mb-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <h1 className="text-3xl font-bold mb-6 text-center">Find Nearby Garages</h1>
          
          {/* Search Box */}
          <div className="max-w-2xl mx-auto bg-white rounded-lg p-2 flex gap-2">
            <div className="flex-1 flex items-center gap-3 px-4 border-r">
              <MapPin className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or location..."
                className="w-full py-2 outline-none text-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn btn-primary px-8">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Filters */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-600">
            Showing <strong>{filteredGarages.length}</strong> garages
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFilter24h(!filter24h)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                filter24h
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Clock className="w-4 h-4" />
              24/7 Only
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>

        {/* Garages List */}
        <div className="space-y-4">
          {filteredGarages.map((garage) => (
            <div
              key={garage.id}
              className="bg-white rounded-xl p-4 md:p-6 shadow-sm border flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="w-full md:w-48 h-48 md:h-auto bg-gray-200 rounded-lg flex-shrink-0 relative overflow-hidden">
                {/* Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white/20">
                  <Wrench className="w-12 h-12" />
                </div>
                {garage.is24Hours && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                    OPEN 24/7
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{garage.name}</h3>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                      <MapPin className="w-4 h-4" />
                      {garage.location}
                      <span className="text-gray-300">•</span>
                      <span className="text-primary font-medium">{garage.distance} away</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-gray-900">{garage.rating}</span>
                    <span className="text-gray-500 text-sm">({garage.reviews})</span>
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {garage.specialties.map((spec) => (
                    <span
                      key={spec}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-auto">
                  <Link
                    href={`/book?garage=${garage.id}`}
                    className="btn btn-primary py-2 px-6"
                  >
                    Book Now
                  </Link>
                  <a
                    href="tel:+8801700000000"
                    className="btn btn-outline py-2 px-4 border-gray-200 hover:border-primary hover:bg-primary hover:text-white"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <Link
                    href={`/garages/${garage.id}`}
                    className="btn btn-outline py-2 px-6 border-gray-200 hover:border-gray-300 ml-auto"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// Import Wrench icon for placeholder
import { Wrench } from "lucide-react";
