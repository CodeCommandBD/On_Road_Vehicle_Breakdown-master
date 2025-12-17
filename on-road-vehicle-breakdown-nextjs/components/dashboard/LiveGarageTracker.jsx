"use client";

import { MapPin, Star, Clock, Navigation, Phone } from "lucide-react";
import { useState, useEffect } from "react";

export default function LiveGarageTracker() {
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - will be replaced with actual API call
    const mockGarages = [
      {
        id: 1,
        name: "QuickFix Auto Center",
        distance: "2.3 km",
        status: "available",
        rating: 4.8,
        activeBookings: 2,
        phone: "01712345678",
      },
      {
        id: 2,
        name: "Pro Mechanics Hub",
        distance: "3.7 km",
        status: "busy",
        rating: 4.6,
        activeBookings: 5,
        phone: "01812345678",
      },
      {
        id: 3,
        name: "City Auto Services",
        distance: "5.1 km",
        status: "available",
        rating: 4.9,
        activeBookings: 1,
        phone: "01912345678",
      },
      {
        id: 4,
        name: "Express Car Care",
        distance: "6.8 km",
        status: "closed",
        rating: 4.5,
        activeBookings: 0,
        phone: "01612345678",
      },
    ];

    setTimeout(() => {
      setGarages(mockGarages);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusConfig = (status) => {
    const configs = {
      available: {
        label: "Available",
        dotColor: "bg-green-500",
        textColor: "text-green-400",
        bgColor: "bg-green-500/20",
      },
      busy: {
        label: "Busy",
        dotColor: "bg-yellow-500",
        textColor: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
      },
      closed: {
        label: "Closed",
        dotColor: "bg-gray-500",
        textColor: "text-gray-400",
        bgColor: "bg-gray-500/20",
      },
    };
    return configs[status] || configs.available;
  };

  if (loading) {
    return (
      <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/2"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/10 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Nearby Garages
        </h3>
        <button className="text-sm text-orange-400 hover:text-orange-300 transition flex items-center gap-1">
          <Navigation className="w-4 h-4" />
          Update Location
        </button>
      </div>

      <div className="space-y-3">
        {garages.map((garage, index) => {
          const statusConfig = getStatusConfig(garage.status);

          return (
            <div
              key={garage.id}
              className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all scale-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Garage Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-white font-semibold">{garage.name}</h4>
                    <div
                      className={`w-2 h-2 ${statusConfig.dotColor} rounded-full pulse-dot`}
                    ></div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-white/60 mb-3">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      {garage.distance}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {garage.rating}
                    </span>
                    {garage.activeBookings > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {garage.activeBookings} active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                    >
                      {statusConfig.label}
                    </span>
                    {garage.status === "available" && (
                      <button className="px-3 py-1 bg-gradient-orange text-white text-xs font-semibold rounded-lg hover:shadow-glow-orange transition-all">
                        Quick Book
                      </button>
                    )}
                  </div>
                </div>

                {/* Call Button */}
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
                  <Phone className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full mt-4 py-2 text-center text-white/60 hover:text-white/90 text-sm transition-colors">
        View all garages on map →
      </button>
    </div>
  );
}
