"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Navigation,
  Phone,
  MessageSquare,
  Play,
  CheckCircle,
  AlertTriangle,
  Plus,
  CreditCard,
  Loader2,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import ReviewForm from "@/components/dashboard/ReviewForm";
import ConfirmationModal from "@/components/common/ConfirmationModal";

export default function MechanicJobDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showJobCardModal, setShowJobCardModal] = useState(false);

  // Job Card State
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

  // States for Bill Addition
  const [newItem, setNewItem] = useState({
    description: "",
    amount: "",
    category: "part",
  });

  // States for Payment
  const [collectionAmount, setCollectionAmount] = useState("");

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/${id}`);
      const data = await res.json();
      if (data.success) {
        setBooking(data.booking);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchBooking();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddBillItem = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const updatedItems = [
        ...(booking.billItems || []),
        { ...newItem, amount: Number(newItem.amount) },
      ];
      // Calculate new total
      const newTotal =
        updatedItems.reduce((sum, item) => sum + item.amount, 0) +
        (booking.estimatedCost || 0);

      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billItems: updatedItems,
          actualCost: newTotal,
        }),
      });

      if (res.ok) {
        toast.success("Bill item added");
        setShowBillModal(false);
        setNewItem({ description: "", amount: "", category: "part" });
        fetchBooking();
      }
    } catch (error) {
      toast.error("Failed to add item");
    } finally {
      setUpdating(false);
    }
  };

  const handleCollectPayment = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: booking.actualCost || booking.estimatedCost,
          paymentMethod: "cash",
          transactionId: `CASH-${Date.now()}`, // Auto-generate for cash
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payment Recorded! 💰");
        setShowPaymentModal(false);
        fetchBooking();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Payment failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveJobCard = async () => {
    setUpdating(true);
    try {
      const res = await fetch("/api/mechanic/job-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: id,
          ...jobCardData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Diagnosis Report Saved 📋");
        setShowJobCardModal(false);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to save report");
    } finally {
      setUpdating(false);
    }
  };

  const updateChecklist = (index, status) => {
    const newChecklist = [...jobCardData.checklist];
    newChecklist[index].status = status;
    setJobCardData({ ...jobCardData, checklist: newChecklist });
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
          Accessing Secure Channel...
        </p>
      </div>
    );
  if (!booking)
    return <div className="text-center py-20">Booking not found</div>;

  const totalBill = booking.actualCost || booking.estimatedCost || 0;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20">
      {/* 1. Navbar / Header */}
      <div className="bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20 px-6 py-4 border-b border-white/5 flex items-center gap-4">
        <Link
          href="/mechanic/dashboard"
          className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="font-black text-white leading-tight uppercase tracking-tight text-lg">
            Mission #{booking.bookingNumber}
          </h1>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
            {new Date(booking.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="ml-auto">
          <span
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              booking.status === "completed"
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : booking.status === "in_progress"
                ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            }`}
          >
            {booking.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* 2. Customer & Location Card */}
        <div className="bg-slate-900/30 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <User className="w-32 h-32" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-3xl overflow-hidden shadow-lg shadow-indigo-600/20 border-2 border-white/10">
                <img
                  src={booking.user?.avatar || "/default-avatar.png"}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {booking.user?.name}
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  Tactical Objective Contact
                </p>
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <a
                href={`tel:${booking.user?.phone}`}
                className="flex-1 md:flex-none flex items-center justify-center p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all transform active:scale-95"
              >
                <Phone className="w-5 h-5" />
              </a>
              <Link
                href={`/mechanic/dashboard/chat?booking=${booking._id}`}
                className="flex-1 md:flex-none flex items-center justify-center p-4 bg-white/5 text-white rounded-2xl border border-white/10 hover:bg-indigo-500 transition-all transform active:scale-95"
              >
                <MessageSquare className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="relative z-10 bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/5 group-hover:border-indigo-500/30 transition-colors">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <MapPin className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Target Coordinates
                </p>
                <p className="text-lg font-bold text-white leading-snug">
                  {booking.location?.address || "Location Classified"}
                </p>
              </div>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${booking.location?.coordinates?.[1]},${booking.location?.coordinates?.[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-950 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all shadow-xl active:scale-95"
            >
              <Navigation className="w-5 h-5" /> Initialize Tactical Nav
            </a>
          </div>
        </div>

        {/* 3. Workflow Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {booking.status === "confirmed" && (
            <button
              onClick={() => handleUpdateStatus("in_progress")}
              disabled={updating}
              className="sm:col-span-2 py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95 group"
            >
              {updating ? (
                <Loader2 className="animate-spin w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 group-hover:scale-125 transition-transform" />
              )}
              Initialize Operation
            </button>
          )}

          {/* Job Card Button */}
          {booking.status === "in_progress" && (
            <button
              onClick={() => setShowJobCardModal(true)}
              className="sm:col-span-2 py-5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-[2rem] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-500 hover:text-white transition-all active:scale-95"
            >
              <ClipboardList className="w-6 h-6" /> Tactical Diagnosis Report
            </button>
          )}

          {booking.status === "in_progress" && (
            <>
              <button
                onClick={() => setShowBillModal(true)}
                className="py-6 bg-slate-900/40 border border-white/5 text-white rounded-[2rem] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all active:scale-95"
              >
                <Plus className="w-8 h-8 text-indigo-500" />
                Add Resources
              </button>
              <button className="py-6 bg-slate-900/40 border border-white/5 text-white rounded-[2rem] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all active:scale-95">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                Req. Logistics
              </button>
            </>
          )}
        </div>

        {/* 4. Billing & Payment Section */}
        <div className="bg-slate-900/30 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
            <h3 className="font-black text-white uppercase tracking-tight">
              Mission Economics
            </h3>
          </div>

          <div className="space-y-4 mb-8">
            {/* Base Cost */}
            <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                Op-Base Fee
              </span>
              <span className="font-black text-white">
                ৳{booking.estimatedCost}
              </span>
            </div>

            {/* Extra Items */}
            {booking.billItems?.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 animate-in fade-in zoom-in-95 duration-300"
              >
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">
                    {item.description}
                  </span>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    {item.category}
                  </span>
                </div>
                <span className="font-black text-white">৳{item.amount}</span>
              </div>
            ))}

            <div className="pt-6 border-t border-white/10 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                  Total Operational Delta
                </p>
                <span className="text-4xl font-black text-white">
                  ৳{totalBill}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {booking.isPaid ? (
            <div className="bg-indigo-500 text-white p-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20">
              <CheckCircle className="w-6 h-6" /> Transaction Finalized
            </div>
          ) : (
            booking.status === "in_progress" && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 transition-all shadow-xl active:scale-95"
              >
                <CreditCard className="w-6 h-6" /> Settle Transaction
              </button>
            )
          )}
        </div>

        {/* 5. Completion Action */}
        {booking.status === "in_progress" && booking.isPaid && (
          <button
            onClick={() => handleUpdateStatus("completed")}
            disabled={updating}
            className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95"
          >
            {updating ? (
              <Loader2 className="animate-spin w-7 h-7" />
            ) : (
              <CheckCircle className="w-7 h-7" />
            )}
            Finalize & Release Objective
          </button>
        )}
      </div>

      {/* MODALS */}
      {/* Add Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
            <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">
              Add Resource Fee
            </h3>
            <form onSubmit={handleAddBillItem} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Resource Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Synthetic Engine Oil"
                  required
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500 transition-all"
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Operational Cost (৳)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  required
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  value={newItem.amount}
                  onChange={(e) =>
                    setNewItem({ ...newItem, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Resource Category
                </label>
                <select
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500 transition-all bg-slate-900"
                  value={newItem.category}
                  onChange={(e) =>
                    setNewItem({ ...newItem, category: e.target.value })
                  }
                >
                  <option value="part">Spare Part</option>
                  <option value="labor">Extra Labor</option>
                  <option value="other">Other Fees</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:text-white transition-all"
                >
                  Abnormal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                >
                  Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] p-10 border border-white/10 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
              <CreditCard className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
              Confirm Settlement
            </h3>
            <p className="text-slate-500 mb-8 font-medium">
              Validate that the operational delta of{" "}
              <span className="font-black text-white">৳{totalBill}</span> has
              been collected in cash?
            </p>

            <button
              onClick={handleCollectPayment}
              disabled={updating}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest mb-4 shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all"
            >
              {updating ? (
                <Loader2 className="animate-spin mx-auto w-6 h-6" />
              ) : (
                "Authorize Disbursement"
              )}
            </button>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full py-4 text-slate-500 font-black uppercase tracking-widest hover:text-white transition-all text-xs"
            >
              Abort Action
            </button>
          </div>
        </div>
      )}

      {/* Job Card Modal */}
      {showJobCardModal && (
        <div className="fixed inset-0 z-50 flex items-start overflow-y-auto sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 pt-10 pb-10">
          <div className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                <ClipboardList className="w-8 h-8 text-indigo-500" /> Tactical
                Diagnosis
              </h3>
              <button
                onClick={() => setShowJobCardModal(false)}
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
                    Odometer Metric (km)
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
                    Fuel Reserve
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
                    <option value="25%">Crit-Low (25%)</option>
                    <option value="50%">Mid-Point (50%)</option>
                    <option value="75%">Optimal (75%)</option>
                    <option value="100%">Full Cap</option>
                  </select>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                  System Scan
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
                          NOMINAL
                        </button>
                        <button
                          onClick={() => updateChecklist(idx, "issue")}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all ${
                            item.status === "issue"
                              ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20"
                              : "bg-white/5 text-slate-600 border-white/5 hover:text-slate-400"
                          }`}
                        >
                          DEFECT
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Operational Observations
                </label>
                <textarea
                  className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white focus:outline-none focus:border-indigo-500 h-28 font-medium placeholder-slate-600"
                  placeholder="Input detailed telemetry observations..."
                  value={jobCardData.notes}
                  onChange={(e) =>
                    setJobCardData({ ...jobCardData, notes: e.target.value })
                  }
                ></textarea>
              </div>

              <button
                onClick={handleSaveJobCard}
                disabled={updating}
                className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
              >
                {updating ? (
                  <Loader2 className="animate-spin mx-auto w-6 h-6" />
                ) : (
                  "Archive Data Report"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
