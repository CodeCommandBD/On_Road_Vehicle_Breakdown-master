"use client";

import { useEffect, useState, use } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Wrench,
  User as UserIcon,
  Phone,
  Mail,
  Car,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Truck,
  DollarSign,
  Briefcase,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";

export default function AdminBookingDetailPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouterWithLoading(); // Regular routing
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);

  const fetchBookingDetail = async () => {
    try {
      const res = await axios.get(`/api/admin/bookings?bookingId=${id}`);
      if (res.data.success) {
        setBooking(res.data.booking);
        setAdminNotes(res.data.booking.dispute?.adminNotes || "");
      }
    } catch (error) {
      console.error("Failed to fetch booking:", error);
      toast.error("Could not load booking details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetail();
  }, [id]);

  const handleResolveDispute = async (resolutionType, status = "resolved") => {
    setIsUpdating(true);
    try {
      // Calculate new actual cost based on resolution
      let newActualCost = booking.actualCost || booking.estimatedCost;
      if (resolutionType === "refund") {
        newActualCost = 0;
      } else if (resolutionType === "adjustment") {
        newActualCost = Math.max(0, newActualCost - adjustmentAmount);
      }

      const res = await axios.put("/api/admin/bookings", {
        bookingId: id,
        dispute: {
          adminNotes,
          status,
          resolutionType,
          resolvedAt: new Date(),
        },
        actualCost: newActualCost,
        status: status === "resolved" ? "completed" : booking.status,
      });

      if (res.data.success) {
        toast.success(
          `Dispute ${status === "resolved" ? "resolved" : "dismissed"}`
        );
        fetchBookingDetail();
      }
    } catch (error) {
      console.error("Resolution Error:", error);
      toast.error("Failed to update dispute status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Booking Not Found
        </h2>
        <Link
          href="/admin/bookings"
          className="text-orange-500 hover:underline"
        >
          Return to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/bookings"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Bookings
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
            Booking ID: {booking.bookingNumber}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              booking.status === "completed"
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : booking.status === "disputed"
                ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse"
                : "bg-white/5 text-white/40 border-white/10"
            }`}
          >
            {booking.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Booking & Dispute Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Dispute Handling Section */}
          {(booking.status === "disputed" ||
            booking.dispute?.status !== "none") && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <ShieldAlert size={120} className="text-red-500" />
              </div>

              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <ShieldAlert className="text-red-500" />
                  Dispute Resolution Center
                </h2>

                <div className="bg-black/40 rounded-2xl p-6 border border-white/5 mb-6">
                  <p className="text-sm font-bold text-red-400 uppercase tracking-widest mb-2">
                    User's Reason:
                  </p>
                  <p className="text-white/80">
                    {booking.dispute?.reason ||
                      booking.description ||
                      "No specific reason provided."}
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-white/60">
                    Admin Resolution Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Document your findings and resolution steps..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-red-500/50 min-h-[120px]"
                  />

                  {(booking.dispute?.status === "pending" ||
                    booking.status === "disputed") && (
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
                      <p className="text-sm font-medium text-white/60">
                        Adjustment Amount (for Partial Refund)
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                          <DollarSign
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                            size={16}
                          />
                          <input
                            type="number"
                            value={adjustmentAmount}
                            onChange={(e) =>
                              setAdjustmentAmount(
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-orange-500/50"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="text-xs text-white/40 italic">
                          This will be subtracted from the current total (৳
                          {booking.actualCost || booking.estimatedCost}).
                        </p>
                      </div>
                    </div>
                  )}

                  {booking.dispute?.status === "pending" ||
                  booking.status === "disputed" ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full pt-4">
                      <button
                        onClick={() =>
                          handleResolveDispute("none", "dismissed")
                        }
                        disabled={isUpdating}
                        className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl border border-white/10 transition-all"
                      >
                        <XCircle size={18} />
                        Dismiss Dispute
                      </button>
                      <button
                        onClick={() =>
                          handleResolveDispute("adjustment", "resolved")
                        }
                        disabled={isUpdating}
                        className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all"
                      >
                        <CheckCircle2 size={18} />
                        Partial Refund
                      </button>
                      <button
                        onClick={() =>
                          handleResolveDispute("refund", "resolved")
                        }
                        disabled={isUpdating}
                        className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-900/20"
                      >
                        <DollarSign size={18} />
                        Full Refund
                      </button>
                    </div>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3 text-green-400">
                      <CheckCircle2 size={20} />
                      <div>
                        <p className="font-bold">Dispute Resolved</p>
                        <p className="text-xs opacity-80">
                          Resolution: {booking.dispute?.resolutionType} | Date:{" "}
                          {new Date(
                            booking.dispute?.resolvedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bill Breakdown (View Only for Admin) */}
          {booking.billItems && booking.billItems.length > 0 && (
            <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-8 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText size={20} className="text-orange-500" />
                Bill Breakdown
              </h3>
              <div className="space-y-3">
                {booking.billItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/5"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {item.description}
                      </p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">
                        {item.category}
                      </p>
                    </div>
                    <p className="text-orange-500 font-bold">৳{item.amount}</p>
                  </div>
                ))}
                {booking.towingRequested && (
                  <div className="flex justify-between items-center p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                    <div>
                      <p className="text-blue-400 font-medium">
                        Towing Service
                      </p>
                      <p className="text-[10px] text-blue-400/40 uppercase tracking-widest">
                        Service
                      </p>
                    </div>
                    <p className="text-blue-400 font-bold">
                      ৳{booking.towingCost}
                    </p>
                  </div>
                )}
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-white/60 font-bold">
                    Total Work Value
                  </span>
                  <span className="text-white text-xl font-bold">
                    ৳{booking.actualCost || booking.estimatedCost}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Service Info */}
          <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase size={20} className="text-orange-500" />
              Service Information
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-white/40 uppercase font-bold tracking-widest">
                  Type
                </p>
                <p className="text-white capitalize">
                  {booking.service?.name || "General Aid"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white/40 uppercase font-bold tracking-widest">
                  Vehicle
                </p>
                <p className="text-white capitalize">
                  {booking.vehicleType} ({booking.vehicleInfo?.brand}{" "}
                  {booking.vehicleInfo?.model})
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white/40 uppercase font-bold tracking-widest">
                  Total Cost
                </p>
                <p className="text-orange-500 font-bold text-lg">
                  ৳{booking.actualCost || booking.estimatedCost}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white/40 uppercase font-bold tracking-widest">
                  Payment
                </p>
                <p
                  className={`${
                    booking.isPaid ? "text-green-500" : "text-red-500"
                  } font-bold uppercase text-xs`}
                >
                  {booking.isPaid ? "Paid" : "Unpaid"} ({booking.paymentMethod})
                </p>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            <div className="space-y-4">
              <p className="text-xs text-white/40 uppercase font-bold tracking-widest">
                Customer Description
              </p>
              <p className="text-white/80 italic leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                "{booking.description || "No description provided."}"
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Stakeholders */}
        <div className="space-y-8">
          {/* Customer Card */}
          <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">
              Customer Information
            </h4>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                <UserIcon size={24} className="text-white/20" />
              </div>
              <div>
                <p className="text-white font-bold">{booking.user?.name}</p>
                <p className="text-xs text-white/40">{booking.user?.email}</p>
              </div>
            </div>
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Phone size={14} /> {booking.user?.phone || "N/A"}
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <MapPin size={14} />{" "}
                {booking.location?.address || "Location unavailable"}
              </div>
            </div>
          </div>

          {/* Garage Card */}
          <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">
              Garage Information
            </h4>
            {booking.garage ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                    <Truck size={24} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-white font-bold">
                      {booking.garage.name}
                    </p>
                    <p className="text-xs text-white/40">
                      {booking.garage.phone}
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <Link
                    href={`/admin/garages/profile?id=${booking.garage._id}`}
                    className="w-full block text-center py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all"
                  >
                    View Garage Profile
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-xs text-white/30 italic">
                No garage assigned yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
