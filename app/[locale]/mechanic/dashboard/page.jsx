"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  Clock,
  CheckCircle,
  AlertTriangle,
  Power,
  ChevronRight,
  Phone,
} from "lucide-react";
import { toast } from "react-toastify";

export default function MechanicDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [openJobs, setOpenJobs] = useState([]);
  const [stats, setStats] = useState({
    points: 0,
    completedToday: 0,
    rating: 0,
  });

  // Toggle Online Status
  const toggleStatus = async () => {
    // API Call placeholder
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    toast.info(newStatus ? "You are now ONLINE 🟢" : "You are now OFFLINE 🔴");
  };

  return (
    <div className="space-y-6">
      {/* 1. Status Header Card */}
      <div
        className={`rounded-3xl p-6 text-white shadow-lg transition-colors ${
          isOnline ? "bg-green-600" : "bg-gray-800"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">
              {isOnline ? "You're Online" : "You're Offline"}
            </h2>
            <p className="opacity-80 text-sm">
              {isOnline
                ? "Ready to receive new jobs"
                : "Go online to start working"}
            </p>
          </div>
          <button
            onClick={toggleStatus}
            className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all border-2 border-white/30"
          >
            <Power className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
          <div className="text-center">
            <span className="block text-xl font-bold">{stats.points}</span>
            <span className="text-xs opacity-70">Points</span>
          </div>
          <div className="text-center border-l border-white/10">
            <span className="block text-xl font-bold">
              {stats.completedToday}
            </span>
            <span className="text-xs opacity-70">Jobs Today</span>
          </div>
          <div className="text-center border-l border-white/10">
            <span className="block text-xl font-bold">{stats.rating}⭐</span>
            <span className="text-xs opacity-70">Rating</span>
          </div>
        </div>
      </div>

      {/* 2. Active Job (Priority View) */}
      {activeJob ? (
        <div className="bg-white rounded-3xl p-1 border border-orange-100 shadow-md overflow-hidden">
          <div className="bg-orange-50 p-4 border-b border-orange-100 flex justify-between items-center">
            <span className="text-sm font-bold text-orange-700 flex items-center gap-2">
              <Clock className="w-4 h-4" /> In Progress
            </span>
            <span className="text-xs text-orange-600 font-mono">#JOB-1234</span>
          </div>

          <div className="p-5">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Honda CBR 150R
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Engine overheating issue
            </p>

            <div className="flex items-start gap-3 mb-6 bg-gray-50 p-3 rounded-xl">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Banani Road 11, Dhaka
                </p>
                <p className="text-xs text-gray-500">2.5 km away</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
                <Navigation className="w-4 h-4" /> Navigate
              </button>
              <Link
                href={`/mechanic/dashboard/bookings/${activeJob}`}
                className="flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200"
              >
                Details <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-white/50 rounded-3xl border border-dashed border-gray-300">
          <p className="text-gray-400">No active jobs right now.</p>
        </div>
      )}

      {/* 3. Open Jobs Pool */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          New Requests{" "}
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            3
          </span>
        </h3>

        <div className="space-y-4">
          {/* Mock Open Job Item */}
          {[1, 2].map((job) => (
            <div
              key={job}
              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:border-orange-200 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-gray-900">Toyota Corolla</h4>
                  <p className="text-xs text-gray-500">Flat Tire • Sedan</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-lg font-bold">
                  Cash
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <MapPin className="w-4 h-4" /> Gulshan 1 Circle (1.2 km)
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-gray-200 active:scale-95 transition-transform">
                  Accept Job
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
