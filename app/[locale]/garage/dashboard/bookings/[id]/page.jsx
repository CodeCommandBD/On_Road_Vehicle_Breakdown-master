"use client";

import { useState, useEffect } from "react";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
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
  Truck,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Save,
  Activity,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import axiosInstance from "@/lib/axios";
import BookingChat from "@/components/dashboard/BookingChat";

export default function GarageBookingDetailsPage() {
  const { id } = useParams();
  const router = useRouterWithLoading(); // Regular routing
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [billItems, setBillItems] = useState([]);
  const [newItem, setNewItem] = useState({
    description: "",
    amount: "",
    category: "part",
  });
  const [showTowingModal, setShowTowingModal] = useState(false);
  const [towingCostInput, setTowingCostInput] = useState("500");
  const [showStartServiceModal, setShowStartServiceModal] = useState(false);
  const [agreedCost, setAgreedCost] = useState("");
  const [declining, setDeclining] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Mechanic Assignment State
  const [mechanics, setMechanics] = useState([]);
  const [assignedMechanicId, setAssignedMechanicId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Complete Service State
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBookingDetails();
      fetchCurrentUser();
      fetchMechanics(); // Fetch team list
    }
  }, [id]);

  const fetchMechanics = async () => {
    try {
      const res = await axiosInstance.get("/garage/team");
      if (res.data.success) {
        setMechanics(res.data.teamMembers?.filter((m) => m.isActive) || []);
      }
    } catch (error) {
      console.error("Failed to fetch mechanics");
    }
  };

  const handleAssignMechanic = async () => {
    if (!assignedMechanicId) return;
    setAssigning(true);
    try {
      const res = await axiosInstance.patch(`/bookings/${id}`, {
        assignedMechanic: assignedMechanicId,
      });
      if (res.data.success) {
        toast.success("Mechanic assigned successfully");
        fetchBookingDetails();
        setAssignedMechanicId("");
      }
    } catch (error) {
      toast.error("Failed to assign mechanic");
    } finally {
      setAssigning(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await axiosInstance.get("/profile");
      if (res.data.success) {
        setCurrentUser(res.data.user);
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
    }
  };

  const fetchBookingDetails = async () => {
    try {
      const res = await axiosInstance.get(`/bookings/${id}`);
      if (res.data.success) {
        setBooking(res.data.booking);
        setBillItems(res.data.booking.billItems || []);
      } else {
        toast.error(res.data.message);
        router.push("/garage/dashboard/bookings");
      }
    } catch (error) {
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    // Intercept 'in_progress' to show Upfront Cost Modal
    if (newStatus === "in_progress") {
      setShowStartServiceModal(true);
      return;
    }

    setIsUpdating(true);
    try {
      const res = await axiosInstance.patch(`/bookings/${id}`, {
        status: newStatus,
      });
      if (res.data.success) {
        toast.success(`Booking marked as ${newStatus}`);
        fetchBookingDetails();
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmStartService = async () => {
    if (!agreedCost) {
      toast.error("Please enter the agreed service cost.");
      return;
    }

    setIsUpdating(true);
    try {
      // Logic: If user input cost, we assume that's the base mechanic labor/part cost estimate so far.
      // We set it as actualCost AND add it as a bill item so user sees it.
      const cost = parseFloat(agreedCost);

      const newBillItem = {
        description: "Agreed Base Service Charge",
        amount: cost,
        category: "labor",
      };

      const updatedBillItems = [...(booking.billItems || []), newBillItem];

      const res = await axiosInstance.patch(`/bookings/${id}`, {
        status: "in_progress",
        actualCost: (booking.towingCost || 0) + cost, // Total
        startedAt: new Date(),
        billItems: updatedBillItems,
      });

      if (res.data.success) {
        toast.success("Service started with agreed cost.");
        setShowStartServiceModal(false);
        fetchBookingDetails();
      }
    } catch (error) {
      toast.error("Failed to start service");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeclineService = async () => {
    setDeclining(true);
    try {
      const visitingFee = 100;
      const res = await axiosInstance.patch(`/bookings/${id}`, {
        status: "cancelled",
        actualCost: (booking.towingCost || 0) + visitingFee,
        cancellationReason: "Customer declined service price",
        billItems: [
          ...(booking.billItems || []),
          {
            description: "Visiting Charge (Customer Declined Service)",
            amount: visitingFee,
            category: "other",
          },
        ],
      });

      if (res.data.success) {
        toast.info("Service cancelled. Visiting fee applied.");
        setShowStartServiceModal(false);
        fetchBookingDetails();
      }
    } catch (error) {
      toast.error("Failed to cancel service");
    } finally {
      setDeclining(false);
    }
  };

  const handleVerifyPayment = async (status) => {
    if (!booking.paymentInfo?._id) return;
    setVerifyingPayment(true);
    try {
      const res = await axiosInstance.patch(`/bookings/${id}/pay`, {
        paymentId: booking.paymentInfo._id,
        status: status, // 'success' or 'failed'
      });
      if (res.data.success) {
        toast.success(
          status === "success" ? "Payment Confirmed!" : "Payment Rejected",
        );
        fetchBookingDetails();
      }
    } catch (err) {
      toast.error("Verification failed");
      setVerifyingPayment(false);
    }
  };

  const handleMarkPaid = () => {
    setShowMarkPaidModal(true);
  };

  const executeMarkPaid = async () => {
    setVerifyingPayment(true);
    try {
      // Create payment record
      await axiosInstance.post(`/bookings/${id}/pay`, {
        paymentMethod: "cash",
        transactionId: `CASH-MANUAL-${Date.now()}`,
        amount: booking.actualCost || booking.estimatedCost,
      });

      toast.success("Payment recorded. Please CONFIRM it in the card below.");
      fetchBookingDetails();
      setShowMarkPaidModal(false);
    } catch (err) {
      toast.error("Failed to mark as paid");
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleConfirmComplete = async (isPaid) => {
    setCompleting(true);
    try {
      if (isPaid) {
        await axiosInstance.post(`/bookings/${id}/pay`, {
          paymentMethod: "cash",
          transactionId: `CASH-${Date.now()}`,
          amount: booking.actualCost || booking.estimatedCost,
        });
      }

      const res = await axiosInstance.patch(`/bookings/${id}`, {
        status: "completed",
      });

      if (res.data.success) {
        toast.success("Service Completed!");
        setShowCompleteModal(false);
        fetchBookingDetails();
      }
    } catch (error) {
      toast.error("Failed to complete service");
    } finally {
      setCompleting(false);
    }
  };

  const handleRequestTowing = async () => {
    const isSubscribed =
      booking.user?.membershipTier && booking.user.membershipTier !== "free";
    const baseTowingCost = isSubscribed ? 0 : 500;

    if (!isSubscribed) {
      setTowingCostInput("500");
      setShowTowingModal(true);
      return;
    }

    submitTowingRequest(baseTowingCost);
  };

  const submitTowingRequest = async (cost) => {
    setIsUpdating(true);
    try {
      const res = await axiosInstance.patch(`/bookings/${id}`, {
        towingRequested: true,
        towingCost: cost,
        actualCost: (booking.actualCost || booking.estimatedCost) + cost,
      });
      if (res.data.success) {
        toast.success("Towing requested and cost updated");
        fetchBookingDetails();
      }
    } catch (error) {
      toast.error("Failed to request towing");
    } finally {
      setIsUpdating(false);
      setShowTowingModal(false);
    }
  };

  const handleAddBillItem = () => {
    if (!newItem.description || !newItem.amount) {
      toast.error("Please provide both description and amount");
      return;
    }
    const updatedItems = [
      ...billItems,
      { ...newItem, amount: parseFloat(newItem.amount) },
    ];
    setBillItems(updatedItems);
    setNewItem({ description: "", amount: "", category: "part" });
  };

  const handleRemoveBillItem = (index) => {
    const updatedItems = billItems.filter((_, i) => i !== index);
    setBillItems(updatedItems);
  };

  const handleSaveBill = async () => {
    setIsUpdating(true);
    try {
      const totalLaborPart = billItems.reduce(
        (acc, item) => acc + item.amount,
        0,
      );
      const towingCost = booking.towingCost || 0;
      const totalActualCost = totalLaborPart + towingCost;

      const res = await axiosInstance.patch(`/bookings/${id}`, {
        billItems: billItems,
        actualCost: totalActualCost,
      });

      if (res.data.success) {
        toast.success("Bill saved successfully");
        fetchBookingDetails();
      }
    } catch (error) {
      toast.error("Failed to save bill");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <Link
        href="/garage/dashboard/bookings"
        className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Bookings
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Status Header */}
          <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-orange-500 font-bold uppercase tracking-wider text-sm">
                Booking #{booking.bookingNumber}
              </span>
              <h1 className="text-3xl font-bold mt-2 mb-4">
                {booking.service?.name || "Vehicle Service"}
              </h1>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span>
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      booking.status === "completed"
                        ? "bg-green-500"
                        : "bg-orange-500"
                    }`}
                  />
                  <span className="capitalize">{booking.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <button
              disabled={
                isUpdating ||
                booking.status === "completed" ||
                booking.status === "cancelled"
              }
              onClick={() =>
                handleUpdateStatus(
                  booking.status === "pending"
                    ? "confirmed"
                    : booking.status === "confirmed"
                      ? "in_progress"
                      : "completed",
                )
              }
              className="p-6 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-3 transition-all"
            >
              <CheckCircle className="w-8 h-8" />
              <span>
                {booking.status === "cancelled"
                  ? "Booking Cancelled"
                  : "Update Status"}
              </span>
            </button>

            <button
              disabled={
                isUpdating ||
                booking.towingRequested ||
                booking.status === "completed" ||
                booking.status === "cancelled"
              }
              onClick={handleRequestTowing}
              className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-3 transition-all"
            >
              <Truck
                className={`w-8 h-8 ${
                  booking.towingRequested ? "text-green-500" : "text-blue-400"
                }`}
              />
              <span>
                {booking.towingRequested
                  ? "Towing Requested"
                  : "Request Towing"}
              </span>
            </button>
          </div>

          {/* Mechanic Assignment Section */}
          <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-8 text-white">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" /> Mechanic Assignment
            </h3>

            {booking.assignedMechanic ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 font-bold text-lg">
                    {booking.assignedMechanic.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-green-400">Assigned To</h4>
                    <p className="font-bold text-xl">
                      {booking.assignedMechanic.name}
                    </p>
                    <p className="text-white/60 text-sm">
                      {booking.assignedMechanic.phone}
                    </p>
                  </div>
                </div>
                {booking.status !== "completed" &&
                  booking.status !== "cancelled" && (
                    <button
                      onClick={() => setAssignedMechanicId("CHANGE")} // Trigger mode to change
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold border border-white/10"
                    >
                      Change
                    </button>
                  )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-white/60">
                  No mechanic assigned yet. Select one to start the job.
                </p>
                <div className="flex gap-3">
                  <select
                    value={assignedMechanicId}
                    onChange={(e) => setAssignedMechanicId(e.target.value)}
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                  >
                    <option value="">Select Mechanic...</option>
                    {mechanics.map((m) => (
                      <option key={m.user._id} value={m.user._id}>
                        {m.name} ({m.role}){" "}
                        {m.user.availability?.status === "busy"
                          ? "🔴 Busy"
                          : "🟢 Free"}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignMechanic}
                    disabled={!assignedMechanicId || assigning}
                    className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold disabled:opacity-50"
                  >
                    {assigning ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Assign"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Show dropdown if changing */}
            {booking.assignedMechanic && assignedMechanicId === "CHANGE" && (
              <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                <p className="text-sm text-yellow-500 mb-2">
                  ⚠ Changing mechanic will notify the new mechanic.
                </p>
                <div className="flex gap-3">
                  <select
                    onChange={(e) => {
                      setAssignedMechanicId(e.target.value);
                      if (e.target.value !== "CHANGE") handleAssignMechanic();
                    }}
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                  >
                    <option value="CHANGE">Select New Mechanic...</option>
                    {mechanics.map((m) => (
                      <option key={m.user._id} value={m.user._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setAssignedMechanicId("")}
                    className="px-4 py-2 bg-white/5 rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {booking.status === "cancelled" && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 flex items-start gap-4">
              <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
              <div>
                <h4 className="text-red-500 font-bold text-lg">
                  Service Cancelled
                </h4>
                <p className="text-white/60">
                  This service was cancelled by the user. As per policy, a
                  minimal visiting fee of **৳100** has been applied to this
                  booking to cover travel costs.
                </p>
              </div>
            </div>
          )}

          {/* User & Vehicle Details */}
          <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-8 text-white">
            {/* Service Details */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-500" /> Requested Service
              </h3>
              <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-6">
                <p className="text-2xl font-bold text-blue-100 mb-2">
                  {booking.service?.name || "General Service"}
                </p>
                {booking.service?.description && (
                  <p className="text-blue-200/70 text-sm">
                    {booking.service.description}
                  </p>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" /> Customer Information
            </h3>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 font-bold">
                {booking.user?.name?.charAt(0)}
              </div>
              <div>
                <p className="font-bold">{booking.user?.name}</p>
                <p className="text-white/40 text-sm">{booking.user?.phone}</p>
              </div>
            </div>

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 mt-8">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> Reported
              Problem
            </h3>
            <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-2xl p-6">
              <p className="text-orange-100 leading-relaxed">
                {booking.description || "No description provided"}
              </p>
            </div>

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 mt-8">
              <Wrench className="w-5 h-5 text-orange-500" /> Vehicle Details
            </h3>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="font-bold text-orange-500">
                {booking.vehicleType?.toUpperCase()}
              </p>
              <p className="text-white/80">
                {booking.vehicleInfo?.brand} {booking.vehicleInfo?.model}
              </p>
              <p className="text-white/40 font-mono text-sm mt-1">
                {booking.vehicleInfo?.plateNumber}
              </p>
            </div>

            {/* Bill Breakdown Section */}
            <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" /> Bill
                  Breakdown
                </h3>
                <button
                  onClick={handleSaveBill}
                  disabled={
                    isUpdating ||
                    booking.status === "completed" ||
                    booking.status === "cancelled"
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-xl text-sm font-bold transition-all"
                >
                  <Save className="w-4 h-4" /> Save Bill
                </button>
              </div>

              <div className="space-y-4">
                {billItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-xs text-white/40 uppercase tracking-widest">
                        {item.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-500">
                        ৳{item.amount}
                      </p>
                    </div>
                    {booking.status !== "completed" &&
                      booking.status !== "cancelled" && (
                        <button
                          onClick={() => handleRemoveBillItem(index)}
                          className="p-2 text-white/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                  </div>
                ))}

                {booking.status !== "completed" &&
                  booking.status !== "cancelled" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-white/5">
                      <input
                        type="text"
                        placeholder="Item name (e.g. Brake Pads)"
                        value={newItem.description}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            description: e.target.value,
                          })
                        }
                        className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-500/50"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Amount"
                          value={newItem.amount}
                          onChange={(e) =>
                            setNewItem({ ...newItem, amount: e.target.value })
                          }
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-500/50"
                        />
                        <select
                          value={newItem.category}
                          onChange={(e) =>
                            setNewItem({ ...newItem, category: e.target.value })
                          }
                          className="bg-black/20 border border-white/10 rounded-xl px-2 py-2 text-xs outline-none focus:border-orange-500/50"
                        >
                          <option value="part">Part</option>
                          <option value="labor">Labor</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <button
                        onClick={handleAddBillItem}
                        className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2 text-sm font-bold transition-all"
                      >
                        <Plus className="w-4 h-4" /> Add Item
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-8 text-white">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-500" /> Billing Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-white/60">
                <span>Estimated Cost</span>
                <span>৳{booking.estimatedCost}</span>
              </div>
              {booking.towingRequested && (
                <div className="flex justify-between text-blue-400">
                  <span>Towing Added</span>
                  <span>+৳{booking.towingCost}</span>
                </div>
              )}
              {booking.actualCost && (
                <div className="flex justify-between text-white">
                  <span>Base Work Cost</span>
                  <span>৳{booking.actualCost - (booking.towingCost || 0)}</span>
                </div>
              )}
              <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xl font-bold">
                <span className="text-white/60">Total</span>
                <span className="text-orange-500">
                  ৳{booking.actualCost || booking.estimatedCost}
                </span>
              </div>
            </div>

            {booking.status === "disputed" && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-red-500 font-bold">Disputed</p>
                  <p className="text-white/60">
                    User has disputed this transaction. Please contact admin.
                  </p>
                </div>
              </div>
            )}

            {/* Mark as Paid Action (For Completed but Unpaid) */}
            {booking.status === "completed" &&
              !booking.isPaid &&
              booking.paymentInfo?.status !== "pending" && (
                <div className="mt-6 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl">
                  <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Pending Payment
                  </h4>
                  <p className="text-white/60 text-sm mb-4">
                    The service is completed but payment is not yet recorded.
                    Did you receive cash?
                  </p>
                  <button
                    onClick={() => handleMarkPaid()}
                    disabled={verifyingPayment}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-all"
                  >
                    {verifyingPayment ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Collection Received (Cash)"
                    )}
                  </button>
                </div>
              )}

            {/* Payment Verification Card */}
            {booking.paymentInfo?.status === "pending" && (
              <div className="mt-6 p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl animate-pulse">
                <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Verify Payment
                </h4>
                <div className="bg-black/30 p-3 rounded-lg mb-4">
                  <p className="text-xs text-white/50 uppercase">
                    Payment Method
                  </p>
                  <p className="font-bold text-white capitalize">
                    {booking.paymentInfo.paymentMethod}
                  </p>
                  <p className="text-xs text-white/50 uppercase mt-2">
                    Transaction ID
                  </p>
                  <p className="font-mono text-xl text-yellow-400 tracking-wider copy-all select-all">
                    {booking.paymentInfo.transactionId || "N/A"}
                  </p>
                  <p className="text-xs text-white/50 uppercase mt-2">Amount</p>
                  <p className="font-bold text-white">
                    ৳{booking.paymentInfo.amount}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerifyPayment("success")}
                    disabled={verifyingPayment}
                    className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm"
                  >
                    Confirm Received
                  </button>
                  <button
                    onClick={() => handleVerifyPayment("failed")}
                    disabled={verifyingPayment}
                    className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 rounded-lg font-bold text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Complete Service Modal */}
          {showCompleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-[#1E1E1E] w-full max-w-md rounded-3xl p-6 text-white border border-white/10 shadow-2xl relative">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Complete Order?</h3>
                  <p className="text-gray-400 mb-6">
                    Is the payment collected? <br />
                    Total Due:{" "}
                    <span className="text-orange-500 font-bold">
                      ৳{booking.actualCost || booking.estimatedCost}
                    </span>
                  </p>

                  <div className="flex flex-col gap-3 w-full">
                    <button
                      onClick={() => handleConfirmComplete(true)}
                      disabled={completing}
                      className="w-full py-3 rounded-xl font-bold bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {completing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Yes, Collected Cash & Complete"
                      )}
                    </button>
                    <button
                      onClick={() => handleConfirmComplete(false)}
                      disabled={completing}
                      className="w-full py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      No, Just Complete (Unpaid)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-8 text-white">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" /> Customer Location
            </h3>

            <div className="bg-green-500/10 border-2 border-green-500/30 rounded-2xl p-6 mb-4">
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <p className="text-green-100 leading-relaxed font-medium">
                  {booking.location?.address || "Address not provided"}
                </p>
              </div>
              {booking.location?.coordinates && (
                <div className="text-xs text-green-200/60 font-mono mt-2 pl-8">
                  Coordinates: {booking.location.coordinates[1]?.toFixed(6)},{" "}
                  {booking.location.coordinates[0]?.toFixed(6)}
                </div>
              )}
            </div>

            <Link
              href={`/garage/dashboard/bookings/${id}/track`}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-bold"
            >
              <Activity className="w-4 h-4" /> Live Track Location
            </Link>
          </div>
        </div>
      </div>
      {booking && currentUser && booking.user && (
        <BookingChat
          bookingId={booking._id}
          recipientId={booking.user._id}
          currentUserId={currentUser._id}
          recipientName={booking.user.name}
        />
      )}
      {/* Towing Cost Modal */}
      {showTowingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">
              Request Towing
            </h3>
            <p className="text-white/60 mb-6">
              Please enter the towing cost for this service (Base ৳500).
            </p>

            <div className="mb-6">
              <label className="text-sm text-white/40 mb-2 block">
                Towing Cost (৳)
              </label>
              <input
                type="number"
                value={towingCostInput}
                onChange={(e) => setTowingCostInput(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white outline-none focus:border-orange-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTowingModal(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  submitTowingRequest(parseInt(towingCostInput) || 500)
                }
                className="flex-1 py-3 rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Start Service / Upfront Cost Modal */}
      {showStartServiceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setShowStartServiceModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-white mb-2">
              Start Service Agreement
            </h3>
            <p className="text-white/60 mb-6">
              Before starting specific work, please agree on an estimated cost
              with the customer. This avoids disputes later.
            </p>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
              <label className="text-sm font-bold text-orange-400 mb-2 block uppercase tracking-wider">
                Agreed Service Cost (৳)
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={agreedCost}
                onChange={(e) => setAgreedCost(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-2xl font-bold text-white outline-none focus:border-orange-500 transition-colors"
                autoFocus
              />
              <p className="text-xs text-white/40 mt-2">
                * This amount is for your service/labor. Parts can be added
                later to the final bill.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmStartService}
                disabled={isUpdating || !agreedCost}
                className="w-full py-4 rounded-xl font-bold bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" /> Confirm & Start Work
                  </>
                )}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-white/30 text-xs uppercase">
                  OR
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button
                onClick={handleDeclineService}
                disabled={declining}
                className="w-full py-3 rounded-xl font-bold bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-500 border border-white/5 hover:border-red-500/30 transition-all flex items-center justify-center gap-2"
              >
                {declining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4" /> Customer Declined (Charge
                    ৳100 Fee)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Confirmation Modal */}
      {showMarkPaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1E1E1E] w-full max-w-md rounded-3xl p-6 text-white border border-white/10 shadow-2xl relative">
            <button
              onClick={() => setShowMarkPaidModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Confirm Cash Payment</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to mark this booking as <br />
                <span className="text-green-500 font-bold">PAID via Cash</span>?
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowMarkPaidModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeMarkPaid}
                  disabled={verifyingPayment}
                  className="flex-1 py-3 rounded-xl font-bold bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  {verifyingPayment ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Yes, Confirm Paid"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
