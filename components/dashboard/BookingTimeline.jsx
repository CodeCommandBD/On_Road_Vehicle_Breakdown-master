"use client";

import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function BookingTimeline({ bookings = [] }) {
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        icon: Clock,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500",
        label: "Pending",
      },
      confirmed: {
        icon: CheckCircle,
        color: "text-blue-500",
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-500",
        label: "Confirmed",
      },
      in_progress: {
        icon: AlertCircle,
        color: "text-purple-500",
        bgColor: "bg-purple-500/20",
        borderColor: "border-purple-500",
        label: "In Progress",
      },
      completed: {
        icon: CheckCircle,
        color: "text-green-500",
        bgColor: "bg-green-500/20",
        borderColor: "border-green-500",
        label: "Completed",
      },
      cancelled: {
        icon: XCircle,
        color: "text-gray-500",
        bgColor: "bg-gray-500/20",
        borderColor: "border-gray-500",
        label: "Cancelled",
      },
    };
    return configs[status] || configs.pending;
  };

  if (!bookings || bookings.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
        <p className="text-white/60">No bookings yet</p>
        <p className="text-white/40 text-sm mt-2">
          Your booking history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-4 sm:p-6 fade-in shadow-xl">
      <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-orange-500" />
        Booking Timeline
      </h3>

      <div className="space-y-3">
        {bookings.slice(0, 5).map((booking, index) => {
          const statusConfig = getStatusConfig(booking.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={booking._id}
              className="flex items-start gap-3 p-3 sm:p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer scale-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Status Icon */}
              <div
                className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-2 rounded-xl p-2 sm:p-3 shrink-0`}
              >
                <StatusIcon
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${statusConfig.color}`}
                />
              </div>

              {/* Booking Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <h4 className="text-white font-semibold text-sm sm:text-base truncate">
                      {booking.service?.name || "Service Request"}
                    </h4>
                    <p className="text-white/60 text-xs sm:text-sm truncate">
                      {booking.garage?.name || "Garage"}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold shrink-0 ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-xs text-white/50">
                  <span className="font-mono">#{booking.bookingNumber}</span>
                  <span className="hidden xs:inline text-white/20">•</span>
                  <span>
                    {booking.createdAt
                      ? formatDistanceToNow(new Date(booking.createdAt), {
                          addSuffix: true,
                        })
                      : "Recently"}
                  </span>
                  {booking.estimatedCost && (
                    <>
                      <span className="hidden xs:inline text-white/20">•</span>
                      <span className="text-green-400 font-bold">
                        ৳{booking.estimatedCost}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {bookings.length > 5 && (
        <button className="w-full mt-4 py-2 text-center text-white/60 hover:text-white/90 text-sm transition-colors">
          View all {bookings.length} bookings →
        </button>
      )}
    </div>
  );
}
