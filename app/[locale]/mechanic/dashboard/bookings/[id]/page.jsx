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
import ReviewForm from "@/components/dashboard/ReviewForm"; // Reusing components where possible

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
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!booking)
    return <div className="text-center py-20">Booking not found</div>;

  const totalBill = booking.actualCost || booking.estimatedCost || 0;

  return (
    <div className="pb-20">
      {/* 1. Navbar / Header */}
      <div className="bg-white sticky top-0 z-20 px-4 py-3 border-b flex items-center gap-3">
        <Link
          href="/mechanic/dashboard"
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="font-bold text-gray-900 leading-tight">
            Job #{booking.bookingNumber}
          </h1>
          <p className="text-xs text-gray-500">
            {new Date(booking.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="ml-auto">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              booking.status === "completed"
                ? "bg-green-100 text-green-700"
                : booking.status === "in_progress"
                ? "bg-orange-100 text-orange-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {booking.status.replace("_", " ").toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 2. Customer & Location Card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
                <img
                  src={booking.user?.avatar || "/default-avatar.png"}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {booking.user?.name}
                </h3>
                <p className="text-xs text-gray-500">{booking.user?.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={`tel:${booking.user?.phone}`}
                className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100"
              >
                <Phone className="w-5 h-5" />
              </a>
              <Link
                href={`/mechanic/dashboard/chat?booking=${booking._id}`}
                className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"
              >
                <MessageSquare className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-500 mt-1 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 mb-2">
                {booking.location?.address || "Location not found"}
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${booking.location?.coordinates?.[1]},${booking.location?.coordinates?.[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700"
              >
                <Navigation className="w-4 h-4" /> Navigate to Customer
              </a>
            </div>
          </div>
        </div>

        {/* 3. Workflow Actions */}
        <div className="grid grid-cols-2 gap-3">
          {booking.status === "confirmed" && (
            <button
              onClick={() => handleUpdateStatus("in_progress")}
              disabled={updating}
              className="col-span-2 py-4 bg-orange-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
            >
              {updating ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Start Service
            </button>
          )}

          {/* Job Card Button */}
          {booking.status === "in_progress" && (
            <button
              onClick={() => setShowJobCardModal(true)}
              className="col-span-2 py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100"
            >
              <ClipboardList className="w-5 h-5" /> Digital Diagnosis Report
            </button>
          )}

          {booking.status === "in_progress" && (
            <>
              <button
                onClick={() => setShowBillModal(true)}
                className="py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-gray-50"
              >
                <Plus className="w-6 h-6 text-primary" />
                Add Parts/Bill
              </button>
              <button className="py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-gray-50">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                Request Towing
              </button>
            </>
          )}
        </div>

        {/* 4. Billing & Payment Section */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Job Details & Billing</h3>

          <div className="space-y-3 mb-4">
            {/* Base Cost */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Charge</span>
              <span className="font-medium">৳{booking.estimatedCost}</span>
            </div>

            {/* Extra Items */}
            {booking.billItems?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.description}{" "}
                  <span className="text-xs text-gray-400">
                    ({item.category})
                  </span>
                </span>
                <span className="font-medium">৳{item.amount}</span>
              </div>
            ))}

            <div className="border-t pt-3 flex justify-between font-bold text-lg text-primary">
              <span>Total Due</span>
              <span>৳{totalBill}</span>
            </div>
          </div>

          {/* Payment Status */}
          {booking.isPaid ? (
            <div className="bg-green-100 text-green-800 p-3 rounded-xl text-center font-bold flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" /> PAID VIA{" "}
              {booking.paymentMethod?.toUpperCase()}
            </div>
          ) : (
            booking.status === "in_progress" && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" /> Collect Payment
              </button>
            )
          )}
        </div>

        {/* 5. Completion Action */}
        {booking.status === "in_progress" && booking.isPaid && (
          <button
            onClick={() => handleUpdateStatus("completed")}
            disabled={updating}
            className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200"
          >
            {updating ? (
              <Loader2 className="animate-spin" />
            ) : (
              <CheckCircle className="w-6 h-6" />
            )}
            Finish Job & Release
          </button>
        )}
      </div>

      {/* MODALS */}
      {/* Add Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
            <h3 className="text-xl font-bold mb-4">Add Bill Item</h3>
            <form onSubmit={handleAddBillItem} className="space-y-3">
              <input
                type="text"
                placeholder="Item Description (e.g. Engine Oil)"
                required
                className="w-full p-3 border rounded-xl"
                value={newItem.description}
                onChange={(e) =>
                  setNewItem({ ...newItem, description: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Amount (৳)"
                required
                className="w-full p-3 border rounded-xl"
                value={newItem.amount}
                onChange={(e) =>
                  setNewItem({ ...newItem, amount: e.target.value })
                }
              />
              <select
                className="w-full p-3 border rounded-xl bg-white"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value })
                }
              >
                <option value="part">Spare Part</option>
                <option value="labor">Extra Labor</option>
                <option value="other">Other Fees</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="flex-1 py-3 bg-gray-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-1">Confirm Cash Payment</h3>
            <p className="text-gray-500 mb-6">
              Confirm that you have received{" "}
              <span className="font-bold text-gray-900">৳{totalBill}</span> from
              the customer?
            </p>

            <button
              onClick={handleCollectPayment}
              disabled={updating}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-bold mb-3 shadow-lg shadow-green-200"
            >
              {updating ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                "Yes, Cash Received"
              )}
            </button>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full py-4 text-gray-500 font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Job Card Modal */}
      {showJobCardModal && (
        <div className="fixed inset-0 z-50 flex items-start overflow-y-auto sm:items-center justify-center bg-black/50 p-4 pt-10 pb-10">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-indigo-600" /> Diagnosis
                Report
              </h3>
              <button
                onClick={() => setShowJobCardModal(false)}
                className="text-gray-400 font-bold p-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Vehicle Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Odometer (km)
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-gray-50 rounded-xl border mt-1"
                    placeholder="e.g. 54000"
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
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Fuel Level
                  </label>
                  <select
                    className="w-full p-3 bg-gray-50 rounded-xl border mt-1"
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
                    <option value="">Select...</option>
                    <option value="25%">Low (25%)</option>
                    <option value="50%">Half (50%)</option>
                    <option value="75%">High (75%)</option>
                    <option value="100%">Full</option>
                  </select>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <h4 className="font-bold mb-3 border-b pb-2">
                  Inspection Checklist
                </h4>
                <div className="space-y-3">
                  {jobCardData.checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-xl"
                    >
                      <span className="font-medium text-sm">{item.item}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateChecklist(idx, "ok")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                            item.status === "ok"
                              ? "bg-green-500 text-white border-green-500"
                              : "bg-white text-gray-400"
                          }`}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => updateChecklist(idx, "issue")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                            item.status === "issue"
                              ? "bg-red-500 text-white border-red-500"
                              : "bg-white text-gray-400"
                          }`}
                        >
                          ISSUE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Mechanic Notes
                </label>
                <textarea
                  className="w-full p-3 bg-gray-50 rounded-xl border mt-1 h-24"
                  placeholder="Detailed observations..."
                  value={jobCardData.notes}
                  onChange={(e) =>
                    setJobCardData({ ...jobCardData, notes: e.target.value })
                  }
                ></textarea>
              </div>

              <button
                onClick={handleSaveJobCard}
                disabled={updating}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200"
              >
                {updating ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : (
                  "Save Report"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
