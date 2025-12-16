import {
  cn,
  getStatusColor,
  getStatusLabel,
  formatPrice,
  formatDateTime,
} from "@/lib/utils/helpers";
import { MoreHorizontal, Eye, Navigation } from "lucide-react";

export default function BookingTable({ type = "user", bookings = [] }) {
  // If no bookings
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
        <p className="text-gray-500">No bookings found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between">
        <h3 className="font-semibold text-lg">Recent Bookings</h3>
        <button className="text-primary text-sm font-medium hover:underline">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-muted uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Booking ID</th>
              <th className="px-6 py-4">
                {type === "user" ? "Garage" : "User"}
              </th>
              <th className="px-6 py-4">Service</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Cost</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {bookings.map((booking) => (
              <tr
                key={booking._id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-gray-900">
                  {booking._id.substring(0, 8).toUpperCase()}...
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {type === "user"
                    ? booking.garage?.name || "Unknown Garage"
                    : booking.user?.name || "Unknown User"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {booking.service?.name ||
                    booking.description?.substring(0, 20) ||
                    "General Service"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatDateTime(booking.createdAt)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      getStatusColor(booking.status)
                    )}
                  >
                    {getStatusLabel(booking.status)}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {formatPrice(booking.estimatedCost)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    {type === "garage" && booking.status === "pending" && (
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-green-600 transition-colors">
                        <Navigation className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
