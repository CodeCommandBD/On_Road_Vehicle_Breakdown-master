"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  User,
  Wrench,
  CreditCard,
  ChevronRight,
  MessageSquare,
  Star,
  ArrowLeft,
  Loader2,
  XCircle,
  AlertCircle,
  Download,
  Printer,
  FileText,
  Car,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ReviewForm from "@/components/dashboard/ReviewForm";
import BookingChat from "@/components/dashboard/BookingChat";
import { downloadReceiptPDF } from "@/lib/utils/clientReceipt";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/maps/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-slate-900/50 animate-pulse rounded-xl" />
  ),
});

export default function BookingDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputing, setDisputing] = useState(false);
  // Estimate State
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [respondingToEstimate, setRespondingToEstimate] = useState(false);

  // Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [transactionId, setTransactionId] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBookingDetails();
      fetchCurrentUser();
    }
  }, [id]);

  useEffect(() => {
    if (booking?.status === "estimate_sent") {
      setShowEstimateModal(true);
    }
  }, [booking?.status]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
    }
  };

  // Poll for live updates (status changes, location, etc.) for any active booking
  useEffect(() => {
    let interval;
    const terminalStatuses = ["completed", "cancelled", "disputed"];

    // If booking exists and is NOT in a terminal status, poll for updates
    if (booking && !terminalStatuses.includes(booking.status)) {
      interval = setInterval(() => {
        fetchBookingDetails(true); // silent update to sync status & location
      }, 3000); // reduced to 3s for "live" feel
    }
    return () => clearInterval(interval);
  }, [booking?.status]);

  const fetchBookingDetails = async (silent = false) => {
    try {
      const res = await fetch(`/api/bookings/${id}`);
      const data = await res.json();
      if (data.success) {
        setBooking(data.booking);
      } else if (!silent) {
        toast.error(data.message);
        router.push("/user/dashboard/bookings");
      }
    } catch (error) {
      if (!silent) toast.error("Failed to load booking details");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    downloadReceiptPDF(booking);
  };

  const handleConfirmReject = async () => {
    setRejecting(true);
    try {
      const res = await fetch(`/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
          towingRequested: false,
          actualCost: 150, // Policy fee for rejection
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.info("Towing rejected. Service cancelled.");
        setShowRejectModal(false);
        fetchBookingDetails();
      }
    } catch (err) {
      toast.error("Failed to reject towing");
    } finally {
      setRejecting(false);
    }
  };

  const handleEstimateResponse = async (action) => {
    // 'approve' or 'reject'
    setRespondingToEstimate(true);
    try {
      const res = await fetch("/api/user/estimate/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id, action }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        setShowEstimateModal(false);
        fetchBookingDetails();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to respond to estimate");
    } finally {
      setRespondingToEstimate(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (paymentMethod === "sslcommerz") {
      setPaying(true);
      try {
        const res = await fetch("/api/bookings/payment/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: id }),
        });
        const data = await res.json();
        if (data.success) {
          window.location.href = data.data.paymentUrl;
        } else {
          toast.error(data.message || "Failed to initialize payment");
          setPaying(false);
        }
      } catch (error) {
        toast.error("Network error");
        setPaying(false);
      }
      return;
    }

    if (!transactionId && paymentMethod !== "cash") {
      toast.error("Please enter Transaction ID");
      return;
    }
    setPaying(true);
    try {
      const res = await fetch(`/api/bookings/${id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          transactionId:
            paymentMethod === "cash" ? `CASH-${Date.now()}` : transactionId,
          amount: booking.actualCost || booking.estimatedCost,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payment submitted for verification");
        setShowPaymentModal(false);
        fetchBookingDetails();
      } else {
        toast.error(data.message || "Payment submission failed");
      }
    } catch (error) {
      toast.error("Network error submitting payment");
    } finally {
      if (paymentMethod !== "sslcommerz") {
        setPaying(false);
      }
    }
  };

  const handleConfirmDispute = async () => {
    setDisputing(true);
    try {
      const res = await fetch(`/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "disputed" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Booking marked as disputed");
        setShowDisputeModal(false);
        fetchBookingDetails();
      }
    } catch (err) {
      toast.error("Failed to mark as disputed");
    } finally {
      setDisputing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) return null;

  // Helper to determine step status
  const getStepStatus = (stepId) => {
    const statusOrder = ["pending", "confirmed", "in_progress", "completed"];
    const currentStatusIndex = statusOrder.indexOf(booking.status);
    // If status is not in the main flow (e.g. cancelled/disputed), handle separately or default to pending
    const stepIndex = statusOrder.indexOf(stepId);

    if (currentStatusIndex === -1) {
      // Handle cancelled/disputed:
      if (booking.status === "cancelled")
        return stepId === "pending" ? "completed" : "pending";
      if (booking.status === "disputed") return "completed"; // Show all as done or special state?
      // For simplicity, if cancelled/disputed, just show based on existence?
      // Actually, let's stick to the happy path for the visual stepper, and showing a banner for Cancelled/Disputed.
      return "pending";
    }

    if (currentStatusIndex > stepIndex) return "completed";
    if (currentStatusIndex === stepIndex) return "active";
    return "pending";
  };

  const steps = [
    {
      id: "pending",
      label: "Booked",
      date: booking.createdAt,
      isCompleted: [
        "confirmed",
        "on_the_way",
        "diagnosing",
        "estimate_sent",
        "in_progress",
        "payment_pending",
        "completed",
      ].includes(booking.status),
      isActive: booking.status === "pending",
    },
    {
      id: "confirmed",
      label: "Confirmed",
      date: booking.confirmedAt,
      isCompleted: [
        "on_the_way",
        "diagnosing",
        "estimate_sent",
        "in_progress",
        "payment_pending",
        "completed",
      ].includes(booking.status),
      isActive: booking.status === "confirmed",
    },
    {
      id: "on_the_way",
      label: "On The Way",
      // Use updatedAt if confirmedAt is past, effectively showing progress
      date: booking.updatedAt,
      isCompleted: [
        "diagnosing",
        "estimate_sent",
        "in_progress",
        "payment_pending",
        "completed",
      ].includes(booking.status),
      isActive: booking.status === "on_the_way",
    },
    {
      id: "diagnosing",
      label: "Diagnosis",
      date: booking.updatedAt,
      isCompleted: [
        "estimate_sent",
        "in_progress",
        "payment_pending",
        "completed",
      ].includes(booking.status),
      isActive: ["diagnosing", "estimate_sent"].includes(booking.status),
    },
    {
      id: "in_progress",
      label: "In Progress",
      date: booking.startedAt,
      isCompleted: ["payment_pending", "completed"].includes(booking.status),
      isActive: booking.status === "in_progress",
    },
    {
      id: "completed",
      label: "Completed",
      date: booking.completedAt,
      isCompleted: booking.status === "completed",
      isActive:
        booking.status === "completed" || booking.status === "payment_pending",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Back Button */}
      <Link
        href="/user/dashboard/bookings"
        className="flex items-center gap-2 text-gray-500 mb-6 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Bookings
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Header */}
          <div className="bg-[#1E1E1E] rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-500 font-bold uppercase tracking-wider text-sm">
                  Booking #{booking.bookingNumber}
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-4">
                {booking.serviceName || "Vehicle Service"}
              </h1>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span>
                    {new Date(
                      booking.scheduledAt || booking.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      booking.status === "completed"
                        ? "bg-green-500"
                        : booking.status === "confirmed"
                        ? "bg-blue-500"
                        : "bg-orange-500"
                    }`}
                  />
                  <span className="capitalize">
                    {booking.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Wrench className="w-32 h-32 rotate-12" />
            </div>
          </div>

          {/* Live Map Tracking */}
          {["on_the_way", "diagnosing"].includes(booking.status) && (
            <div className="bg-white rounded-3xl p-2 border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <MapPin className="w-5 h-5 text-indigo-600" />
                  </div>
                  Live Mechanic Tracking
                </h3>
                {booking.driverLocation?.updatedAt && (
                  <span className="text-xs text-gray-400 font-mono">
                    Updated:{" "}
                    {new Date(
                      booking.driverLocation.updatedAt
                    ).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-100 h-[300px] w-full relative z-0">
                {booking.driverLocation?.lat ? (
                  <MapComponent
                    center={[
                      booking.driverLocation.lat,
                      booking.driverLocation.lng,
                    ]}
                    zoom={15}
                    markers={[
                      {
                        lat: booking.driverLocation.lat,
                        lng: booking.driverLocation.lng,
                        content: "Mechanic is here 🔧",
                      },
                    ]}
                    className="h-full w-full"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-300" />
                    <p>Waiting for mechanic location signal...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tracking Progress */}
          <div className="bg-white rounded-3xl p-8 border shadow-sm">
            <h3 className="text-lg font-bold mb-6">Service Timeline</h3>
            <div className="relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[27px] top-4 bottom-10 w-0.5 bg-gray-100" />

              <div className="space-y-8 relative">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    {/* Icon Circle */}
                    <div
                      className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                        step.isCompleted
                          ? "bg-green-500 border-green-100 text-white shadow-lg shadow-green-500/20"
                          : step.isActive
                          ? "bg-white border-orange-500 text-orange-500 shadow-xl shadow-orange-500/20 scale-110"
                          : "bg-white border-gray-100 text-gray-300"
                      }`}
                    >
                      {step.isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : step.isActive ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <span className="font-bold text-lg">{idx + 1}</span>
                      )}
                    </div>

                    {/* Text Content */}
                    <div
                      className={`pt-2 transition-all duration-300 ${
                        step.isActive ? "translate-x-2" : ""
                      }`}
                    >
                      <h4
                        className={`font-bold text-lg leading-none mb-1 ${
                          step.isCompleted
                            ? "text-green-600"
                            : step.isActive
                            ? "text-orange-600"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </h4>
                      {step.date && (
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full w-fit mt-2">
                          <Clock className="w-3 h-3" />
                          {new Date(step.date).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                      )}
                      {step.isActive && (
                        <p className="text-sm text-gray-500 mt-1 animate-pulse font-medium">
                          Currently active...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Garage Info */}
          <div className="bg-white rounded-3xl p-8 border shadow-sm">
            <h3 className="text-lg font-bold mb-6">Garage Information</h3>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Wrench className="w-10 h-10 text-gray-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold">{booking.garage?.name}</h4>
                <div className="flex items-center gap-4 mt-2 text-gray-600">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {booking.garage?.rating?.average || 4.5}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {booking.garage?.address?.city}
                  </span>
                </div>
              </div>
              <button className="p-4 bg-orange-100 text-primary rounded-2xl hover:bg-orange-200 transition-colors">
                <MessageSquare className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Review Section (Visible only if completed) */}
          {booking.status === "completed" && !booking.review && (
            <ReviewForm
              bookingId={booking._id}
              onReviewSubmitted={() => fetchBookingDetails()}
            />
          )}

          {booking.status === "completed" && booking.review && (
            <div className="bg-green-50 border border-green-100 rounded-3xl p-8">
              <h3 className="text-lg font-bold text-green-900 mb-2">
                You rated this service
              </h3>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < booking.review.rating
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-green-800 text-sm italic">
                "{booking.review.comment}"
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Pricing & Vehicle */}
        <div className="space-y-6">
          {/* Price Summary */}
          <div className="bg-white rounded-3xl p-8 border shadow-sm">
            <h3 className="text-lg font-bold mb-6">Payment Summary</h3>
            <div className="space-y-4">
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="font-bold text-lg text-gray-900">
                  Total Cost
                </span>
                <span className="text-2xl font-bold text-orange-600">
                  ৳{booking.actualCost || booking.estimatedCost}
                </span>
              </div>

              {booking.billItems && booking.billItems.length > 0 && (
                <div className="pt-4 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Work Breakdown
                  </p>
                  {booking.billItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.description}</span>
                      <span className="font-medium text-gray-900">
                        ৳{item.amount}
                      </span>
                    </div>
                  ))}
                  {/* Fixed Service Fee */}
                  <div className="flex justify-between text-sm border-t border-dashed pt-2 mt-2">
                    <span className="text-gray-600 font-medium">
                      Service Fee
                    </span>
                    <span className="font-medium text-gray-900">৳1000</span>
                  </div>
                  {booking.towingRequested && (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Towing Service</span>
                      <span className="font-medium">৳{booking.towingCost}</span>
                    </div>
                  )}
                </div>
              )}

              {booking.status === "completed" && (
                <button
                  onClick={handleDownloadReceipt}
                  className="w-full mt-6 py-3 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-5 h-5" />
                  Download Receipt
                </button>
              )}

              <div
                className={`mt-4 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold ${
                  booking.isPaid
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {booking.isPaid ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {booking.isPaid
                  ? booking.paymentMethod === "cash"
                    ? "Payment Verified by Mechanic"
                    : "Payment Completed"
                  : booking.paymentInfo?.status === "pending"
                  ? "Verification Pending"
                  : "Payment Pending"}
              </div>

              {!booking.isPaid &&
                booking.status !== "disputed" &&
                booking.status !== "cancelled" &&
                booking.paymentInfo?.status !== "pending" && (
                  <div className="space-y-3 mt-4">
                    {booking.towingRequested && (
                      <button
                        onClick={() => setShowRejectModal(true)}
                        className="w-full py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Towing & Cancel
                      </button>
                    )}

                    {/* Only show Pay Now if status is payment_pending or completed (but unpaid) */}
                    {(booking.status === "payment_pending" ||
                      booking.status === "completed") && (
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-900/20"
                      >
                        Pay Now
                      </button>
                    )}

                    <button
                      onClick={() => setShowDisputeModal(true)}
                      className="w-full py-2.5 rounded-xl text-sm font-bold border border-red-500/30 text-red-500 hover:bg-red-500/5 transition-all"
                    >
                      Report Issue
                    </button>
                  </div>
                )}

              {booking.paymentInfo?.status === "pending" && (
                <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100 text-center">
                  <p className="font-bold">Payment Verification Pending</p>
                  <p>TrxID: {booking.paymentInfo.transactionId}</p>
                  <p className="text-xs mt-1">
                    Please wait for garage approval.
                  </p>
                </div>
              )}

              {booking.status === "disputed" && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                  <p className="font-bold mb-1">Under Investigation</p>
                  This booking is currently in dispute. Our support team will
                  contact you shortly.
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-white rounded-3xl p-8 border shadow-sm">
            <h3 className="text-lg font-bold mb-6">Vehicle Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-bold">
                    {booking.vehicle?.make} {booking.vehicle?.model}
                  </p>
                  <p className="text-sm text-gray-500 uppercase">
                    {booking.vehicle?.licensePlate}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Issue Description
                </p>
                <p className="text-sm text-gray-700">
                  {booking.description || "No specific issues mentioned."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {booking && currentUser && booking.garage?.owner && (
        <BookingChat
          bookingId={booking._id}
          recipientId={booking.garage.owner}
          currentUserId={currentUser._id}
          recipientName={booking.garage.name}
        />
      )}
      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1E1E1E] w-full max-w-md rounded-3xl p-6 text-white border border-white/10 shadow-2xl relative">
            <button
              onClick={() => setShowRejectModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Reject Service?</h3>
              <p className="text-gray-400 mb-6">
                Rejecting towing will cancel the entire service. <br />A minimal
                visiting fee of{" "}
                <span className="text-orange-500 font-bold">৳100</span> will be
                charged for the mechanic's time.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={rejecting}
                  className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  {rejecting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Confirm Reject"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1E1E1E] w-full max-w-md rounded-3xl p-6 text-white border border-white/10 shadow-2xl relative">
            <button
              onClick={() => setShowDisputeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Report an Issue?</h3>
              <p className="text-gray-400 mb-6">
                Are you facing any problem with this service? <br />
                Our support team will investigate and help you.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDispute}
                  disabled={disputing}
                  className="flex-1 py-3 rounded-xl font-bold bg-orange-500 hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  {disputing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Confirm Report"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Estimate Modal */}
      {showEstimateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
            {/* Diagnosis Report Section */}
            {booking.jobCard && (
              <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-indigo-500" />
                  Diagnosis Report
                </h4>

                {/* Vehicle Stats */}
                <div className="flex gap-4 mb-4 text-sm">
                  <div className="bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm">
                    <span className="text-xs text-slate-400 font-bold block">
                      Odometer
                    </span>
                    <span className="font-mono font-bold text-slate-700">
                      {booking.jobCard.vehicleDetails?.odometer || "N/A"} km
                    </span>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm">
                    <span className="text-xs text-slate-400 font-bold block">
                      Fuel
                    </span>
                    <span className="font-bold text-slate-700">
                      {booking.jobCard.vehicleDetails?.fuelLevel || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Inspection Checklist */}
                <div className="space-y-2 mb-4">
                  {booking.jobCard.checklist?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-sm border-b border-slate-100 pb-1 last:border-0 hover:bg-white p-1 rounded transition-colors"
                    >
                      <span className="text-slate-600 font-medium">
                        {item.item}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          item.status === "issue"
                            ? "bg-red-100 text-red-600 border border-red-200"
                            : "bg-emerald-100 text-emerald-600 border border-emerald-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Mechanic Notes */}
                {booking.jobCard.notes && (
                  <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-sm text-yellow-800 italic">
                    <span className="font-bold not-italic text-yellow-900 block text-xs uppercase mb-1">
                      Mechanic's Observation:
                    </span>
                    "{booking.jobCard.notes}"
                  </div>
                )}
              </div>
            )}

            <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-orange-500" />
              Service Estimate
            </h3>
            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto">
              {booking.billItems &&
                booking.billItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-xl"
                  >
                    <div>
                      <p className="font-bold text-gray-800">
                        {item.description}
                      </p>
                      <span className="text-xs uppercase font-bold text-gray-400">
                        {item.category}
                      </span>
                    </div>
                    <span className="font-bold text-lg">৳{item.amount}</span>
                  </div>
                ))}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="font-bold text-xl">Total Estimate</span>
                <span className="font-black text-2xl text-orange-600">
                  ৳{booking.estimatedCost}
                </span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-sm mb-6">
              <p className="font-bold mb-1">Important:</p>
              <p>
                Approval starts the job immediately. <br /> Rejection incurs a{" "}
                <b>৳150</b> visit fee for the mechanic's time.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleEstimateResponse("reject")}
                disabled={respondingToEstimate}
                className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold"
              >
                Reject (Pay ৳150)
              </button>
              <button
                onClick={() => handleEstimateResponse("approve")}
                disabled={respondingToEstimate}
                className="flex-[2] py-3 bg-orange-500 text-white hover:bg-orange-600 rounded-xl font-bold shadow-lg shadow-orange-500/20"
              >
                Approve & Start
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              Make Payment
            </h3>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Select Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["cash", "sslcommerz"].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3 rounded-lg text-sm font-bold border capitalize ${
                      paymentMethod === method
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {method === "sslcommerz" ? "Online Payment" : method}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
                Please hand over{" "}
                <b>৳{booking.actualCost || booking.estimatedCost}</b> to the
                mechanic directly.
              </div>
            )}

            {paymentMethod === "sslcommerz" && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl text-sm text-gray-700">
                <p className="font-semibold mb-2">Secure Online Payment</p>
                You will be redirected to SSLCommerz gateway to pay via:
                <ul className="list-disc list-inside mt-2 text-xs">
                  <li>bKash, Nagad, Rocket</li>
                  <li>Credit/Debit Card</li>
                  <li>Mobile/Internet Banking</li>
                </ul>
              </div>
            )}

            <button
              onClick={handlePaymentSubmit}
              disabled={paying}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {paying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Submit Payment"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
