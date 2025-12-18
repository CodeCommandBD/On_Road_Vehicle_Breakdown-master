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
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ReviewForm from "@/components/dashboard/ReviewForm";

export default function BookingDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (id) fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const res = await fetch(`/api/bookings/${id}`);
      const data = await res.json();
      if (data.success) {
        setBooking(data.booking);
      } else {
        toast.error(data.message);
        router.push("/user/dashboard/bookings");
      }
    } catch (error) {
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
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

  const steps = [
    { label: "Booked", status: "completed", date: booking.createdAt },
    {
      label: "Confirmed",
      status:
        booking.status === "confirmed" || booking.status === "completed"
          ? "completed"
          : "pending",
    },
    {
      label: "In Progress",
      status:
        booking.status === "in-progress" || booking.status === "completed"
          ? "completed"
          : "pending",
    },
    {
      label: "Completed",
      status: booking.status === "completed" ? "completed" : "pending",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Back Button */}
      <Link
        href="/user/dashboard/bookings"
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors w-fit"
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
                    {new Date(booking.bookingDate).toLocaleDateString()}
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
                  <span className="capitalize">{booking.status}</span>
                </div>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Wrench className="w-32 h-32 rotate-12" />
            </div>
          </div>

          {/* Tracking Progress */}
          <div className="bg-white rounded-3xl p-8 border shadow-sm">
            <h3 className="text-lg font-bold mb-6">Service Timeline</h3>
            <div className="relative">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 mb-8 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        step.status === "completed"
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-gray-200 text-gray-400"
                      }`}
                    >
                      {step.status === "completed" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`w-0.5 h-full ${
                          steps[idx + 1].status === "completed"
                            ? "bg-orange-500"
                            : "bg-gray-100"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-4">
                    <p
                      className={`font-bold ${
                        step.status === "completed"
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-xs text-gray-500">
                        {new Date(step.date).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
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
              <div className="flex justify-between text-gray-600">
                <span>Estimated Cost</span>
                <span>৳{booking.estimatedCost}</span>
              </div>
              {booking.actualCost && (
                <div className="flex justify-between text-gray-600">
                  <span>Actual Cost</span>
                  <span>৳{booking.actualCost}</span>
                </div>
              )}
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="text-2xl font-bold text-primary">
                  ৳{booking.actualCost || booking.estimatedCost}
                </span>
              </div>

              <div
                className={`mt-4 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold ${
                  booking.isPaid
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                {booking.isPaid ? "Payment Completed" : "Payment Pending"}
              </div>

              {!booking.isPaid && (
                <button className="w-full btn btn-primary mt-4">Pay Now</button>
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
    </div>
  );
}
