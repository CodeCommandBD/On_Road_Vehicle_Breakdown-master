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
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import ReviewForm from "@/components/dashboard/ReviewForm";
import ConfirmationModal from "@/components/common/ConfirmationModal";

export default function MechanicJobDetails() {
  const { id } = useParams();
  const router = useRouterWithLoading(); // Regular routing
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
      </div>

      {/* Message: All actions are on Dashboard */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 text-center">
          <p className="text-indigo-400 font-bold mb-2">
            ℹ️ All Actions Available on Dashboard
          </p>
          <p className="text-slate-400 text-sm">
            To update status, add diagnosis, manage billing, or complete this
            job, please return to your dashboard.
          </p>
          <Link
            href="/mechanic/dashboard"
            className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
