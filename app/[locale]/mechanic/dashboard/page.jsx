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
  Wrench,
  Trophy,
  Star,
  Settings,
  Bell,
  Search,
  ClipboardList,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import axiosInstance from "@/lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function MechanicDashboard() {
  const queryClient = useQueryClient();

  // 1. Fetch Dashboard Data
  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ["mechanicDashboard"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/mechanic/dashboard");
      return res.data.data;
    },
    refetchInterval: 10000, // Poll every 10s
  });

  const { stats, attendance, activeJobs, openJobs, mechanic } =
    dashboardData || {
      stats: {},
      attendance: {},
      activeJobs: [],
      openJobs: [],
    };
  const isOnDuty = attendance?.clockIn && !attendance?.clockOut;

  // Mutations
  const attendanceMutation = useMutation({
    mutationFn: async (action) => {
      const res = await axiosInstance.post("/api/mechanic/attendance", {
        action,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["mechanicDashboard"] });
    },
    onError: () => toast.error("Failed to update attendance"),
  });

  const sosMutation = useMutation({
    mutationFn: async (location) => {
      const res = await axiosInstance.post("/api/mechanic/sos", { location });
      return res.data;
    },
    onSuccess: () => {
      toast.error("SOS ALERT SENT! HELP IS ON THE WAY!", {
        autoClose: false,
        theme: "dark",
      });
    },
    onError: () => toast.error("Failed to send SOS"),
  });

  const jobActionMutation = useMutation({
    mutationFn: async ({ url, method = "POST", body }) => {
      const res = await axiosInstance({ url, method, data: body });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Action successful");
      queryClient.invalidateQueries({ queryKey: ["mechanicDashboard"] });
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Action failed"),
  });

  // State
  const [activeJobForAction, setActiveJobForAction] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [estimateModalOpen, setEstimateModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [shiftReminderShown, setShiftReminderShown] = useState(false);
  const [estimateItems, setEstimateItems] = useState([
    { description: "", amount: "", category: "part" },
  ]);
  const [finalBillAmount, setFinalBillAmount] = useState("");
  const [jobCardData, setJobCardData] = useState({
    vehicleDetails: { odometer: "", fuelLevel: "" },
    checklist: [
      { category: "Engine", item: "Engine Oil Level", status: "ok" },
      { category: "Engine", item: "Coolant Level", status: "ok" },
      { category: "Brakes", item: "Brake Fluid", status: "ok" },
      { category: "Tires", item: "Tire Pressure", status: "ok" },
    ],
    notes: "",
  });

  // Keep location tracking as is since it's a side effect polling
  useEffect(() => {
    if (!activeJobs || activeJobs.length === 0) return;
    const updatePosition = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        for (const job of activeJobs) {
          axiosInstance
            .post("/api/mechanic/location/update", {
              bookingId: job._id,
              location: { lat: latitude, lng: longitude },
            })
            .catch(console.error);
        }
      });
    };
    updatePosition();
    const interval = setInterval(updatePosition, 10000);
    return () => clearInterval(interval);
  }, [activeJobs]);

  // --- Workflow Handlers ---
  const handleStatusUpdate = (bookingId, status) => {
    jobActionMutation.mutate({
      url: "/api/mechanic/status/update",
      body: { bookingId, status },
    });
  };

  const handleSubmitEstimate = () => {
    const totalCost = estimateItems.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    jobActionMutation.mutate(
      {
        url: "/api/mechanic/estimate/create",
        body: {
          bookingId: activeJobForAction._id,
          items: estimateItems,
          totalCost,
        },
      },
      {
        onSuccess: () => setEstimateModalOpen(false),
      },
    );
  };

  const handleSubmitBill = () => {
    jobActionMutation.mutate(
      {
        url: "/api/mechanic/bill/update",
        body: {
          bookingId: activeJobForAction._id,
          totalCost: Number(finalBillAmount) || 0,
        },
      },
      {
        onSuccess: () => {
          setBillModalOpen(false);
          setModalType(null);
          setIsModalOpen(false);
        },
      },
    );
  };

  const handleConfirmPayment = async (method) => {
    let paymentId = activeJobForAction?.paymentInfo?.paymentId;
    if (!paymentId) {
      try {
        const paymentRes = await axiosInstance.get(
          `/api/payments/by-booking/${activeJobForAction._id}`,
        );
        if (paymentRes.data.success && paymentRes.data.payment) {
          paymentId = paymentRes.data.payment._id;
        }
      } catch (err) {
        console.error("Failed to fetch payment record:", err);
      }
    }

    if (!paymentId) {
      toast.error("Payment record not found");
      return;
    }

    jobActionMutation.mutate(
      {
        url: `/api/bookings/${activeJobForAction._id}/pay`,
        method: "PATCH",
        body: { status: "success", paymentId },
      },
      {
        onSuccess: () => setPaymentModalOpen(false),
      },
    );
  };

  // Diagnosis Report Handler
  const handleSaveDiagnosis = () => {
    if (!activeJobForAction) return;
    jobActionMutation.mutate(
      {
        url: "/api/mechanic/job-card",
        body: { bookingId: activeJobForAction._id, ...jobCardData },
      },
      {
        onSuccess: () => {
          toast.success("Diagnosis Report Saved 📋");
          setDiagnosisModalOpen(false);
          setJobCardData({
            vehicleDetails: { odometer: "", fuelLevel: "" },
            checklist: [
              { category: "Engine", item: "Engine Oil Level", status: "ok" },
              { category: "Engine", item: "Coolant Level", status: "ok" },
              { category: "Brakes", item: "Brake Fluid", status: "ok" },
              { category: "Tires", item: "Tire Pressure", status: "ok" },
            ],
            notes: "",
          });
        },
      },
    );
  };

  // Add Bill Item Handler
  const handleAddBillItem = (e) => {
    e.preventDefault();
    if (!activeJobForAction) return;

    const description = e.target.description.value;
    const amount = Number(e.target.amount.value);
    const category = e.target.category.value;

    const updatedItems = [
      ...(activeJobForAction.billItems || []),
      { description, amount, category },
    ];
    const newTotal =
      updatedItems.reduce((sum, item) => sum + item.amount, 0) +
      (activeJobForAction.estimatedCost || 0);

    jobActionMutation.mutate(
      {
        url: `/api/bookings/${activeJobForAction._id}`,
        method: "PATCH",
        body: { billItems: updatedItems, actualCost: newTotal },
      },
      {
        onSuccess: () => {
          toast.success("Bill item added 💰");
          setBillModalOpen(false);
          e.target.reset();
        },
      },
    );
  };

  const handleAttendance = () => {
    const action = isOnDuty ? "out" : "in";
    attendanceMutation.mutate(action, {
      onSuccess: () => setIsModalOpen(false),
    });
  };

  const handleSOS = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sosMutation.mutate(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          {
            onSuccess: () => setIsModalOpen(false),
          },
        );
      },
      () => {
        toast.error("Could not get location. SOS alert failed.");
        setIsModalOpen(false);
      },
    );
  };

  const handleAcceptJob = (bookingId) => {
    jobActionMutation.mutate({
      url: "/api/mechanic/jobs",
      body: { bookingId },
    });
  };

  // Tracking Feedback State
  const trackingStatus = {}; // Derived or managed via mutation status if needed

  // location tracking effect is now in the main block

  // Add the missing updateChecklist helper
  const updateChecklist = (index, status) => {
    const newChecklist = [...jobCardData.checklist];
    newChecklist[index].status = status;
    setJobCardData({ ...jobCardData, checklist: newChecklist });
  };

  const triggerModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <Wrench className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-400 font-medium">Synchronizing Dashboard...</p>
      </div>
    );
  }

  const handleNavigation = (location) => {
    if (!location) {
      toast.error("Destination location unavailable");
      return;
    }

    // Open window immediately to satisfy browser popup blockers
    const mapWindow = window.open("", "_blank");
    if (!mapWindow) {
      toast.error("Pop-up blocked! Please allow pop-ups for this site.");
      return;
    }

    // Show a loading text in the new tab while getting location
    mapWindow.document.write("Loading navigation...");

    const openMap = (startLat, startLng) => {
      // Use OpenStreetMap instead of Google Maps (Free, no API key needed)
      let url =
        "https://www.openstreetmap.org/directions?engine=fossgis_osrm_car";

      // Set Origin (Mechanic's current location)
      if (startLat && startLng) {
        url += `&route=${startLat}%2C${startLng}`;
      }

      // Set Destination (User's location)
      if (location.coordinates && location.coordinates.length === 2) {
        const [lng, lat] = location.coordinates;
        url += `%3B${lat}%2C${lng}`;
      } else if (location.address) {
        // Fallback: Open map centered on address (search)
        url = `https://www.openstreetmap.org/search?query=${encodeURIComponent(
          location.address,
        )}`;
      } else {
        mapWindow.close();
        toast.error("Invalid destination data");
        return;
      }

      // Update the already opened window
      mapWindow.location.href = url;
    };

    // Try to get current location (Mechanic's location)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Force immediate update to backend so User Tracking matches Navigation Origin
          if (activeJobs && activeJobs.length > 0) {
            activeJobs.forEach((job) => {
              axiosInstance
                .post("/api/mechanic/location/update", {
                  bookingId: job._id,
                  location: { lat: latitude, lng: longitude },
                })
                .catch((err) =>
                  console.error("Force location update failed", err),
                );
            });
          }

          openMap(latitude, longitude);
        },
        (error) => {
          console.warn(
            "Location access denied or failed, using default map behavior",
          );
          openMap(null, null); // Fallback to maps auto-detect
        },
      );
    } else {
      openMap(null, null);
    }
  };

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
                      attendance.clockIn,
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
              disabled={attendanceMutation.isPending}
              className={`group flex items-center gap-3 px-8 py-5 rounded-[2rem] font-bold text-lg transition-all transform active:scale-95 shadow-2xl ${
                isOnDuty
                  ? "bg-white text-slate-950 hover:bg-slate-200"
                  : "bg-indigo-500 text-white hover:bg-indigo-400 shadow-indigo-900/40"
              }`}
            >
              {attendanceMutation.isPending ? (
                <Wrench className="w-6 h-6 animate-spin" />
              ) : (
                <Power className="w-6 h-6" />
              )}
              {isOnDuty ? "Clock Out" : "Clock In"}
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
                      {trackingStatus[job._id] && (
                        <span className="ml-2 px-4 py-1.5 rounded-full bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest border border-white/10">
                          {trackingStatus[job._id]}
                        </span>
                      )}
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

                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          {/* Navigation - Primarily for getting there */}
                          {["confirmed", "on_the_way"].includes(job.status) && (
                            <button
                              onClick={() => handleNavigation(job.location)}
                              className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-500/20 text-indigo-300 rounded-xl font-bold uppercase text-xs hover:bg-indigo-500/30 transition-all border border-indigo-500/30"
                            >
                              <Navigation className="w-4 h-4" />
                              <span>Navigate</span>
                            </button>
                          )}
                          <Link
                            href={`/mechanic/dashboard/bookings/${job._id}`}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase text-xs hover:bg-slate-700 border border-white/10 transition-all"
                          >
                            <span>Details</span>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                        {/* Diagnosis and Bill Buttons */}
                        {job.status === "in_progress" && (
                          <div className="flex gap-2">
                            {!job.hasJobCard && (
                              <button
                                onClick={() => {
                                  setActiveJobForAction(job);
                                  setDiagnosisModalOpen(true);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-500/20 text-indigo-300 rounded-xl font-bold uppercase text-xs hover:bg-indigo-500/30 transition-all border border-indigo-500/30"
                              >
                                <ClipboardList className="w-4 h-4" />
                                <span>Diagnosis</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setActiveJobForAction(job);
                                setBillModalOpen(true); // Opens "Add Item" modal
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500/20 text-emerald-300 rounded-xl font-bold uppercase text-xs hover:bg-emerald-500/30 transition-all border border-emerald-500/30"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Extra</span>
                            </button>
                          </div>
                        )}
                        {/* Workflow Actions */}
                        {job.status === "confirmed" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(job._id, "on_the_way")
                            }
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-blue-500 shadow-lg shadow-blue-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <Navigation className="w-5 h-5" />
                            Start Travel
                          </button>
                        )}
                        {job.status === "on_the_way" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(job._id, "diagnosing")
                            }
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <MapPin className="w-5 h-5" />
                            Arrived & Diagnose
                          </button>
                        )}
                        {job.status === "diagnosing" && (
                          <>
                            {!job.hasJobCard ? (
                              <button
                                onClick={() => {
                                  setActiveJobForAction(job);
                                  setDiagnosisModalOpen(true);
                                }}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-indigo-500 shadow-lg shadow-indigo-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                <ClipboardList className="w-5 h-5" />
                                Create Diagnosis Report
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveJobForAction(job);
                                  setEstimateModalOpen(true);
                                }}
                                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-purple-500 shadow-lg shadow-purple-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                <Settings className="w-5 h-5" />
                                Create Estimate
                              </button>
                            )}
                          </>
                        )}
                        {job.status === "estimate_sent" && (
                          <div className="w-full py-4 bg-slate-800/50 border border-white/5 rounded-2xl flex items-center justify-center gap-2 text-slate-400 font-bold uppercase tracking-wider animate-pulse">
                            <Clock className="w-5 h-5" />
                            Waiting for Approval...
                          </div>
                        )}
                        {job.status === "in_progress" && (
                          <button
                            onClick={() => {
                              setActiveJobForAction(job);
                              // Pre-calculate final bill
                              const currentTotal =
                                (job.billItems || []).reduce(
                                  (sum, i) => sum + i.amount,
                                  0,
                                ) + 1000; // Add fixed service fee
                              setFinalBillAmount(currentTotal);
                              setModalType("final_bill");
                              setIsModalOpen(true); // Re-using generic modal switch or just use specific state? Using generic + type
                            }}
                            className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-green-500 shadow-lg shadow-green-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Finish Work & Bill
                          </button>
                        )}
                        {job.status === "payment_pending" && (
                          <div className="space-y-3">
                            {/* Payment Info Display */}
                            {job.isPaymentSubmitted && job.paymentDetails && (
                              <div className="bg-blue-900/40 border border-blue-500/30 rounded-xl p-4 text-sm">
                                <div className="flex justify-between items-center mb-2 border-b border-blue-500/20 pb-2">
                                  <span className="text-blue-200 font-bold uppercase tracking-wider text-[10px]">
                                    Payment Verification
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                      job.paymentDetails.method === "cash"
                                        ? "bg-emerald-500/20 text-emerald-300"
                                        : "bg-pink-500/20 text-pink-300"
                                    }`}
                                  >
                                    {job.paymentDetails.method}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">
                                      TrxID:
                                    </span>
                                    <span className="font-mono text-white select-all">
                                      {job.paymentDetails.transactionId}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">
                                      Amount:
                                    </span>
                                    <span className="font-bold text-white">
                                      ৳{job.paymentDetails.amount}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <button
                              onClick={() => {
                                setActiveJobForAction(job);
                                setPaymentModalOpen(true);
                              }}
                              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-orange-500 shadow-lg shadow-orange-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                              <Bell className="w-5 h-5" />
                              Collect Payment
                            </button>
                          </div>
                        )}
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
                        disabled={
                          (jobActionMutation.isPending &&
                            jobActionMutation.variables?.body?.bookingId ===
                              job._id) ||
                          (activeJobs && activeJobs.length > 0)
                        }
                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                          jobActionMutation.isPending &&
                          jobActionMutation.variables?.body?.bookingId ===
                            job._id
                            ? "bg-slate-700 text-slate-400"
                            : activeJobs && activeJobs.length > 0
                              ? "bg-slate-800/50 text-slate-600 cursor-not-allowed border border-white/5"
                              : "bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-900/20"
                        }`}
                      >
                        {jobActionMutation.isPending &&
                        jobActionMutation.variables?.body?.bookingId ===
                          job._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Deploy Now"
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#020617]/40 border-2 border-dashed border-white/5 rounded-[2.5rem] p-12 text-center">
                  {!isOnDuty ? (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <Power className="w-12 h-12 text-slate-600" />
                      </div>
                      <p className="text-slate-400 font-bold text-lg">
                        Clock in to see available requests
                      </p>
                      <p className="text-slate-600 text-sm">
                        You must be on duty to accept jobs
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-500 font-medium italic">
                      No external requests in the immediate sector.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Floating SOS */}
      <button
        onClick={() => triggerModal("sos")}
        disabled={sosMutation.isPending}
        className="fixed bottom-28 sm:bottom-8 right-8 z-[60] w-20 h-20 rounded-[2rem] bg-red-600 text-white shadow-[0_0_50px_-12px_rgba(220,38,38,0.5)] flex items-center justify-center animate-pulse hover:bg-red-500 active:scale-95 transition-all border-4 border-white/10 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent"></div>
        {sosMutation.isPending ? (
          <Loader2 className="w-10 h-10 animate-spin relative z-10" />
        ) : (
          <AlertTriangle className="w-10 h-10 relative z-10" />
        )}
      </button>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen && modalType !== "final_bill"}
        isLoading={attendanceMutation.isPending || sosMutation.isPending}
        title={
          modalType === "sos"
            ? "CRITICAL SOS ALERT"
            : modalType === "attendance_in"
              ? "Initialize Duty"
              : modalType === "shift_reminder"
                ? "Shift Limit Reached"
                : "Terminate Shift"
        }
        message={
          modalType === "sos"
            ? "This will transmit your live coordinates to HQ and the local response team. Use only in extreme emergency."
            : modalType === "attendance_in"
              ? "You are about to go online. New missions will be visible in your local sector."
              : modalType === "shift_reminder"
                ? "You have been online for over 9 hours. Standard safety protocols recommend terminating your shift to prevent fatigue."
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
          !attendanceMutation.isPending &&
          !sosMutation.isPending &&
          setIsModalOpen(false)
        }
      />

      {/* Estimate Modal */}
      {estimateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-4">
              Create Estimate
            </h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {estimateItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      placeholder="Item description"
                      className="w-full bg-slate-800 border-white/10 rounded-xl px-3 py-2 text-sm"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...estimateItems];
                        newItems[index].description = e.target.value;
                        setEstimateItems(newItems);
                      }}
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Cost"
                        className="flex-1 bg-slate-800 border-white/10 rounded-xl px-3 py-2 text-sm"
                        value={item.amount}
                        onChange={(e) => {
                          const newItems = [...estimateItems];
                          newItems[index].amount = e.target.value;
                          setEstimateItems(newItems);
                        }}
                      />
                      <select
                        className="bg-slate-800 border-white/10 rounded-xl px-2 py-2 text-sm"
                        value={item.category}
                        onChange={(e) => {
                          const newItems = [...estimateItems];
                          newItems[index].category = e.target.value;
                          setEstimateItems(newItems);
                        }}
                      >
                        <option value="part">Part</option>
                        <option value="labor">Labor</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newItems = estimateItems.filter(
                        (_, i) => i !== index,
                      );
                      setEstimateItems(newItems);
                    }}
                    className="text-red-400 p-2"
                  >
                    X
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setEstimateItems([
                    ...estimateItems,
                    { description: "", amount: "", category: "part" },
                  ])
                }
                className="text-indigo-400 text-sm font-bold"
              >
                + Add Item
              </button>
              <div className="border-t border-white/10 pt-4 flex justify-between font-bold text-white">
                <span>Total Estimate:</span>
                <span>
                  ৳{" "}
                  {estimateItems.reduce(
                    (sum, item) => sum + Number(item.amount),
                    0,
                  )}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEstimateModalOpen(false)}
                className="flex-1 py-3 bg-slate-800 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEstimate}
                className="flex-1 py-3 bg-indigo-600 rounded-xl font-bold text-white"
              >
                Send Estimate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {billModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center">
            <h3 className="text-xl font-black text-white mb-2">
              Finalize Bill
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Enter the total bill amount for this service
            </p>

            {/* Show Diagnosis/Estimate Cost if available */}
            {activeJobForAction?.estimatedCost && (
              <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">
                    Estimated Cost:
                  </span>
                  <span className="text-white font-bold">
                    ৳{activeJobForAction.estimatedCost}
                  </span>
                </div>
              </div>
            )}

            <div className="w-full bg-slate-800 border border-white/10 rounded-2xl px-6 py-6 text-center mb-6">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                Total Bill Amount
              </p>
              <div className="text-4xl font-black text-white">
                ৳{finalBillAmount}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                (Estimate + Approved Extras)
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBillModalOpen(false)}
                className="flex-1 py-3 bg-slate-800 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitBill}
                className="flex-1 py-3 bg-green-600 rounded-xl font-bold text-white"
              >
                Submit Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center">
            <h3 className="text-xl font-black text-white mb-6">
              Confirm Payment
            </h3>
            <div className="space-y-4">
              {activeJobForAction?.paymentInfo && (
                <div className="bg-slate-800 rounded-xl p-4 text-left border border-white/5 mb-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">
                    User Submission:
                  </p>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Method:</span>
                    <span className="text-white capitalize">
                      {activeJobForAction.paymentInfo.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">TrxID:</span>
                    <span className="text-indigo-400 font-mono text-xs">
                      {activeJobForAction.paymentInfo.transactionId}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Amount:</span>
                    <span className="text-green-400 font-bold">
                      ৳{activeJobForAction.paymentInfo.amount}
                    </span>
                  </div>
                </div>
              )}
              <button
                onClick={() => handleConfirmPayment("cash")}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 list-none"
              >
                Cash Received
              </button>
              <button
                onClick={() => handleConfirmPayment("online")}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-indigo-500 shadow-lg shadow-indigo-900/40 list-none"
              >
                Verify Online Payment
              </button>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="w-full py-3 text-slate-400 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bill Item Modal (During Work) */}
      {billModalOpen && activeJobForAction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
            <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">
              Add Extra Item
            </h3>
            <form onSubmit={handleAddBillItem} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="e.g. Extra Engine Oil"
                  required
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Amount (৳)
                </label>
                <input
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  required
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Category
                </label>
                <select
                  name="category"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500 transition-all bg-slate-900"
                >
                  <option value="part">Spare Part</option>
                  <option value="labor">Labor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setBillModalOpen(false)}
                  className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mx-auto w-5 h-5" />
                  ) : (
                    "Add"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Final Bill Modal (Finish Work) */}
      {modalType === "final_bill" && activeJobForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center">
            <h3 className="text-xl font-black text-white mb-2">
              Finalize & Close Job
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Review total bill before submission.
            </p>

            <div className="mb-6 space-y-2 text-left bg-slate-800/50 p-4 rounded-xl border border-white/5">
              {/* Service Fee */}
              <div className="flex justify-between text-sm text-slate-400">
                <span>Service Fee:</span>
                <span>৳1000</span>
              </div>
              {/* Calc extras */}
              <div className="flex justify-between text-sm text-slate-400">
                <span>Added Extras:</span>
                <span>
                  ৳
                  {(activeJobForAction.billItems || []).reduce(
                    (sum, i) => sum + i.amount,
                    0,
                  )}
                </span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-white text-lg">
                <span>Total:</span>
                <span>৳{finalBillAmount}</span>
              </div>
            </div>

            <input
              type="number"
              placeholder="Total Bill Amount (৳)"
              className="w-full bg-slate-800 border border-white/10 rounded-2xl px-6 py-4 text-2xl font-bold text-center text-white mb-6 focus:ring-2 ring-indigo-500 outline-none"
              value={finalBillAmount}
              onChange={(e) => setFinalBillAmount(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalType(null);
                  setIsModalOpen(false);
                }}
                className="flex-1 py-3 bg-slate-800 rounded-xl font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitBill}
                className="flex-1 py-3 bg-green-600 rounded-xl font-bold text-white shadow-lg shadow-green-900/20 hover:bg-green-500"
              >
                Submit Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diagnosis Report Modal */}
      {diagnosisModalOpen && activeJobForAction && (
        <div className="fixed inset-0 z-50 flex items-start overflow-y-auto sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 pt-10 pb-10">
          <div className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                <ClipboardList className="w-8 h-8 text-indigo-500" /> Diagnosis
                Report
              </h3>
              <button
                onClick={() => setDiagnosisModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors p-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-8">
              {/* Vehicle Stats */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Odometer (km)
                  </label>
                  <input
                    type="text"
                    className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="000XXX"
                    value={jobCardData.vehicleDetails.odometer}
                    onChange={(e) =>
                      setJobCardData({
                        ...jobCardData,
                        vehicleDetails: {
                          ...jobCardData.vehicleDetails,
                          odometer: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Fuel Level
                  </label>
                  <select
                    className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white focus:outline-none focus:border-indigo-500 bg-slate-900"
                    value={jobCardData.vehicleDetails.fuelLevel}
                    onChange={(e) =>
                      setJobCardData({
                        ...jobCardData,
                        vehicleDetails: {
                          ...jobCardData.vehicleDetails,
                          fuelLevel: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="">Select Level</option>
                    <option value="25%">Low (25%)</option>
                    <option value="50%">Half (50%)</option>
                    <option value="75%">Good (75%)</option>
                    <option value="100%">Full</option>
                  </select>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                  Inspection
                </h4>
                <div className="space-y-3">
                  {jobCardData.checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5"
                    >
                      <span className="font-bold text-slate-300 text-sm tracking-tight">
                        {item.item}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateChecklist(idx, "ok")}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all ${
                            item.status === "ok"
                              ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-600/20"
                              : "bg-white/5 text-slate-600 border-white/5 hover:text-slate-400"
                          }`}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => updateChecklist(idx, "issue")}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all ${
                            item.status === "issue"
                              ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20"
                              : "bg-white/5 text-slate-600 border-white/5 hover:text-slate-400"
                          }`}
                        >
                          ISSUE
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add New Inspection Item */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                    <input
                      type="text"
                      placeholder="Add custom check..."
                      className="flex-1 bg-white/5 rounded-xl border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      id="newInspectionInput"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input =
                          document.getElementById("newInspectionInput");
                        if (input.value.trim()) {
                          setJobCardData({
                            ...jobCardData,
                            checklist: [
                              ...jobCardData.checklist,
                              {
                                category: "Custom",
                                item: input.value.trim(),
                                status: "ok",
                              },
                            ],
                          });
                          input.value = "";
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold uppercase hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Notes
                </label>
                <textarea
                  className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white focus:outline-none focus:border-indigo-500 h-28 font-medium placeholder-slate-600"
                  placeholder="Enter observations..."
                  value={jobCardData.notes}
                  onChange={(e) =>
                    setJobCardData({ ...jobCardData, notes: e.target.value })
                  }
                ></textarea>
              </div>

              <button
                onClick={handleSaveDiagnosis}
                disabled={jobActionMutation.isPending}
                className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
              >
                {jobActionMutation.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  "Finalize Diagnosis"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bill Item Modal */}
      {billModalOpen && activeJobForAction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
            <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">
              Add Bill Item
            </h3>
            <form onSubmit={handleAddBillItem} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="e.g. Engine Oil"
                  required
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Amount (৳)
                </label>
                <input
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  required
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Category
                </label>
                <select
                  name="category"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500 transition-all bg-slate-900"
                >
                  <option value="part">Spare Part</option>
                  <option value="labor">Labor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setBillModalOpen(false)}
                  className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mx-auto w-5 h-5" />
                  ) : (
                    "Add"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
