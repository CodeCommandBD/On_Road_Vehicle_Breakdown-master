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

import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

export default function MechanicDashboard() {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(null); // { status: "clocked_in" | "clocked_out" | "not_started" }
  const [processingAttendance, setProcessingAttendance] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);

  const [activeJob, setActiveJob] = useState(null);
  const [stats, setStats] = useState({
    points: 0,
    completedToday: 0,
    rating: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Parallel fetch: Attendance, User Stats, Jobs (Active)
      const [attRes] = await Promise.all([
        fetch("/api/mechanic/attendance").then((r) => r.json()),
        // Add other fetches here later
      ]);

      if (attRes.success) {
        setAttendance(attRes.data);
      }
    } catch (error) {
      console.error("Dashboard fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async (action) => {
    setProcessingAttendance(true);
    try {
      const res = await fetch("/api/mechanic/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setAttendance(data.data);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to update attendance");
    } finally {
      setProcessingAttendance(false);
    }
  };

  const handleSOS = async () => {
    if (
      !confirm("🚨 ARE YOU SURE? This will alert the garage owner immediately!")
    )
      return;

    setSosLoading(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const res = await fetch("/api/mechanic/sos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: { lat: latitude, lng: longitude },
            }),
          });
          const data = await res.json();
          if (data.success) {
            toast.error("SOS ALERT SENT! HELP IS ON THE WAY!", {
              autoClose: false,
            });
          }
          setSosLoading(false);
        },
        (err) => {
          toast.error("Could not get location. Sending generic alert.");
          // Fallback SOS without coords
          setSosLoading(false);
        }
      );
    } catch (err) {
      toast.error("Failed to send SOS");
      setSosLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* 1. Attendance / Status Card */}
      <div
        className={`rounded-3xl p-6 text-white shadow-lg transition-colors relative overflow-hidden ${
          attendance?.clockOut
            ? "bg-gray-800"
            : attendance?.clockIn
            ? "bg-green-600"
            : "bg-gray-800"
        }`}
      >
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div>
            <h2 className="text-2xl font-bold">
              {attendance?.clockIn && !attendance?.clockOut
                ? "You're On Duty"
                : "Off Duty"}
            </h2>
            <p className="opacity-80 text-sm">
              {attendance?.clockIn && !attendance?.clockOut
                ? `Started at ${new Date(attendance.clockIn).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" }
                  )}`
                : "Clock in to start your shift"}
            </p>
          </div>

          <button
            onClick={() =>
              handleAttendance(
                attendance?.clockIn && !attendance?.clockOut ? "out" : "in"
              )
            }
            disabled={processingAttendance}
            className={`px-6 py-3 rounded-xl font-bold border-2 transition-all flex items-center gap-2 ${
              attendance?.clockIn && !attendance?.clockOut
                ? "bg-white/10 border-white/30 hover:bg-white/20"
                : "bg-green-500 border-green-400 hover:bg-green-400 text-white shadow-lg shado-green-900"
            }`}
          >
            {processingAttendance ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Power className="w-5 h-5" />
            )}
            {attendance?.clockIn && !attendance?.clockOut
              ? "Clock Out"
              : "Clock In"}
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

      {/* SOS Floating Button */}
      <button
        onClick={handleSOS}
        disabled={sosLoading}
        className="fixed bottom-24 right-4 z-50 w-16 h-16 rounded-full bg-red-600 text-white shadow-2xl flex items-center justify-center animate-pulse hover:bg-red-700 active:scale-95 transition-all border-4 border-white/20"
      >
        {sosLoading ? (
          <Loader2 className="animate-spin w-8 h-8" />
        ) : (
          <AlertTriangle className="w-8 h-8" />
        )}
      </button>
    </div>
  );
}
