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
  Loader2,
  Trophy,
  Star,
  Settings,
  Bell,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";
import ConfirmationModal from "@/components/common/ConfirmationModal";

export default function MechanicDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [processingAttendance, setProcessingAttendance] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [acceptingJob, setAcceptingJob] = useState(null);

  // Modal States
  const [modalType, setModalType] = useState(null); // 'attendance_in', 'attendance_out', 'sos'
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // Poll for updates every 10 seconds to handle cancellations/new jobs
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/mechanic/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.message);
      }
    } catch (error) {
      console.error("Dashboard fetch error", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async () => {
    const action =
      data?.attendance?.clockIn && !data?.attendance?.clockOut ? "out" : "in";
    setProcessingAttendance(true);
    try {
      const res = await fetch("/api/mechanic/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        fetchDashboardData();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error("Failed to update attendance");
    } finally {
      setProcessingAttendance(false);
      setIsModalOpen(false);
    }
  };

  const handleSOS = async () => {
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
          const result = await res.json();
          if (result.success) {
            toast.error("SOS ALERT SENT! HELP IS ON THE WAY!", {
              autoClose: false,
              theme: "dark",
            });
          }
          setSosLoading(false);
          setIsModalOpen(false);
        },
        (err) => {
          toast.error("Could not get location. SOS alert failed.");
          setSosLoading(false);
          setIsModalOpen(false);
        }
      );
    } catch (err) {
      toast.error("Failed to send SOS");
      setSosLoading(false);
      setIsModalOpen(false);
    }
  };

  const handleAcceptJob = async (bookingId) => {
    setAcceptingJob(bookingId);
    try {
      const res = await fetch("/api/mechanic/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Job accepted! Head to the location.");
        fetchDashboardData();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error("Failed to accept job");
    } finally {
      setAcceptingJob(null);
    }
  };

  const triggerModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-400 font-medium">Synchronizing Dashboard...</p>
      </div>
    );
  }

  const { stats, attendance, activeJobs, openJobs, mechanic } = data || {};
  const isOnDuty = attendance?.clockIn && !attendance?.clockOut;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24">
      {/* Page Title Section */}
      <div className="px-6 pt-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
          Workforce Portal
        </h1>
        <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mt-1">
          Mechanic Operations Command
        </p>
      </div>

      <div className="p-6 space-y-8 max-w-4xl mx-auto">
        {/* Status Card */}
        <div
          className={`relative overflow-hidden rounded-[2.5rem] border p-8 shadow-2xl transition-all duration-500 ${
            isOnDuty
              ? "bg-indigo-500/10 border-indigo-500/20 ring-1 ring-indigo-500/10"
              : "bg-slate-900/30 border-white/5 shadow-black/40"
          }`}
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Power
              className={`w-32 h-32 ${
                isOnDuty ? "text-indigo-400" : "text-slate-400"
              }`}
            />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`w-3 h-3 rounded-full animate-pulse ${
                    isOnDuty ? "bg-indigo-400" : "bg-slate-500"
                  }`}
                ></span>
                <h2 className="text-3xl font-bold text-white">
                  {isOnDuty ? "System Active" : "Standby Mode"}
                </h2>
              </div>
              <p className="text-slate-400 font-medium">
                {isOnDuty
                  ? `Shift duration: ${new Date(
                      attendance.clockIn
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} → Current`
                  : "Clock in to initialize availability"}
              </p>
            </div>

            <button
              onClick={() =>
                triggerModal(isOnDuty ? "attendance_out" : "attendance_in")
              }
              disabled={processingAttendance}
              className={`group flex items-center gap-3 px-8 py-5 rounded-[2rem] font-bold text-lg transition-all transform active:scale-95 shadow-2xl ${
                isOnDuty
                  ? "bg-white text-slate-950 hover:bg-slate-200"
                  : "bg-indigo-500 text-white hover:bg-indigo-400 shadow-indigo-900/40"
              }`}
            >
              {processingAttendance ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Power className="w-6 h-6" />
              )}
              {isOnDuty ? "End Shift" : "Begin Shift"}
            </button>
          </div>

          {/* Micro Stats */}
          <div className="relative z-10 grid grid-cols-3 gap-4 mt-12 p-6 rounded-3xl bg-black/40 backdrop-blur-md border border-white/5">
            <div className="text-center group cursor-pointer">
              <div className="flex justify-center mb-1">
                <Trophy className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="block text-2xl font-black text-white">
                {stats.points}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">
                Merit Points
              </span>
            </div>
            <div className="text-center group cursor-pointer border-x border-white/5">
              <div className="flex justify-center mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="block text-2xl font-black text-white">
                {stats.completedToday}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">
                Today's Duty
              </span>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="flex justify-center mb-1">
                <Star className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="block text-2xl font-black text-white">
                {stats.rating}
                <span className="text-sm font-normal text-slate-500">/5</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">
                Performance
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Sections */}
        <div className="grid grid-cols-1 gap-8">
          {/* Active Job Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-indigo-500 rounded-full"></div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Priority Mission
              </h3>
            </div>
            {activeJobs && activeJobs.length > 0 ? (
              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <div
                    key={job._id}
                    className="group relative overflow-hidden bg-slate-900/20 border border-white/5 rounded-[2.5rem] p-8 hover:border-indigo-500/30 transition-all duration-300"
                  >
                    <div className="absolute top-0 right-0 p-6">
                      <span className="px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
                        Live Operation
                      </span>
                    </div>

                    <div className="flex flex-col gap-6">
                      <div>
                        <h4 className="text-2xl font-bold text-white mb-2">
                          {job.user?.name || "Client"}
                        </h4>
                        <p className="text-slate-400 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-indigo-400" />
                          {job.location?.address}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <button className="flex-[1.5] flex items-center justify-center gap-3 py-4 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                          <Navigation className="w-5 h-5" />
                          <span className="text-sm">Navigate</span>
                        </button>
                        <Link
                          href={`/mechanic/dashboard/bookings/${job._id}`}
                          className="flex-1 flex items-center justify-center gap-3 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-slate-700 border border-white/10 transition-all text-center"
                        >
                          <span className="text-sm">View Details</span>
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#020617]/40 border-2 border-dashed border-white/5 rounded-[2.5rem] p-12 text-center">
                <p className="text-slate-500 font-medium">
                  No live priority missions assigned.
                </p>
              </div>
            )}
          </section>

          {/* Open Jobs pool */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-slate-500 rounded-full"></div>
                <h3 className="text-xl font-black text-white tracking-tight text-glow">
                  Available Requests
                </h3>
              </div>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-slate-400">
                {openJobs?.length || 0} Total
              </span>
            </div>

            <div className="space-y-4">
              {openJobs && openJobs.length > 0 ? (
                openJobs.map((job) => (
                  <div
                    key={job._id}
                    className="bg-slate-900/20 border border-white/5 p-6 rounded-[2rem] hover:bg-slate-800/40 hover:border-white/10 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                          {job.user?.name || "Unknown Client"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{" "}
                          {new Date(job.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block font-black text-white">
                          ৳ {job.estimatedCost || "TBD"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                          {job.paymentMethod}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-4 items-center">
                      <p className="flex-1 text-sm text-slate-400 line-clamp-1 italic">
                        "
                        {job.description ||
                          "General emergency assistance required"}
                        "
                      </p>
                      <button
                        onClick={() => handleAcceptJob(job._id)}
                        disabled={acceptingJob === job._id || !!activeJob}
                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                          acceptingJob === job._id
                            ? "bg-slate-700 text-slate-400"
                            : !!activeJob
                            ? "bg-slate-800/50 text-slate-600 cursor-not-allowed border border-white/5"
                            : "bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-900/20"
                        }`}
                      >
                        {acceptingJob === job._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Deploy Now"
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center opacity-50 italic">
                  No external requests in the immediate sector.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Floating SOS */}
      <button
        onClick={() => triggerModal("sos")}
        disabled={sosLoading}
        className="fixed bottom-28 sm:bottom-8 right-8 z-[60] w-20 h-20 rounded-[2rem] bg-red-600 text-white shadow-[0_0_50px_-12px_rgba(220,38,38,0.5)] flex items-center justify-center animate-pulse hover:bg-red-500 active:scale-95 transition-all border-4 border-white/10 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent"></div>
        {sosLoading ? (
          <Loader2 className="w-10 h-10 animate-spin relative z-10" />
        ) : (
          <AlertTriangle className="w-10 h-10 relative z-10" />
        )}
      </button>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        isLoading={processingAttendance || sosLoading}
        title={
          modalType === "sos"
            ? "CRITICAL SOS ALERT"
            : modalType === "attendance_in"
            ? "Initialize Duty"
            : "Terminate Shift"
        }
        message={
          modalType === "sos"
            ? "This will transmit your live coordinates to HQ and the local response team. Use only in extreme emergency."
            : modalType === "attendance_in"
            ? "You are about to go online. New missions will be visible in your local sector."
            : "Confirm shift termination. You will no longer be visible for priority mission deployments."
        }
        confirmText={
          modalType === "sos"
            ? "TRANSMIT SOS"
            : modalType === "attendance_in"
            ? "Go Online"
            : "Go Offline"
        }
        type={modalType === "sos" ? "warning" : "info"}
        onConfirm={modalType === "sos" ? handleSOS : handleAttendance}
        onCancel={() =>
          !processingAttendance && !sosLoading && setIsModalOpen(false)
        }
      />

      <style jsx global>{`
        .text-glow {
          text-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
