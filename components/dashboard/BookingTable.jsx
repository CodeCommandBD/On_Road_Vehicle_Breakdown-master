import {
  cn,
  getStatusColor,
  getStatusLabel,
  formatPrice,
  formatDateTime,
} from "@/lib/utils/helpers";
import Link from "next/link";
import {
  Eye,
  Phone,
  XCircle,
  Package,
  Check,
  Clock,
  Search,
} from "lucide-react";
import { useSelector } from "react-redux";
import { selectSearchTerm } from "@/store/slices/uiSlice";
import { useTranslations } from "next-intl";

export default function BookingTable({
  type = "user",
  bookings = [],
  onStatusUpdate,
}) {
  const t = useTranslations("Bookings");
  const commonT = useTranslations("Common");
  const searchTerm = useSelector(selectSearchTerm);

  const filteredBookings = bookings.filter((booking) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();

    const matchesName = (
      type === "user" ? booking.garage?.name : booking.user?.name
    )
      ?.toLowerCase()
      .includes(search);
    const matchesVehicle = booking.vehicleType?.toLowerCase().includes(search);
    const matchesNumber = booking.bookingNumber?.toLowerCase().includes(search);
    const matchesStatus = booking.status?.toLowerCase().includes(search);

    return matchesName || matchesVehicle || matchesNumber || matchesStatus;
  });
  // If no bookings at all
  if (bookings.length === 0) {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-12 text-center">
        <Package className="w-16 h-16 text-white/30 mx-auto mb-4" />
        <p className="text-white/60">{t("noBookings")}</p>
        <p className="text-white/40 text-sm mt-2">
          {type === "garage" ? t("newRequestsAppear") : t("createFirst")}
        </p>
      </div>
    );
  }

  // If filtered results are empty
  if (filteredBookings.length === 0) {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-12 text-center">
        <Search className="w-16 h-16 text-white/30 mx-auto mb-4" />
        <p className="text-white/60">{t("noMatching")}</p>
        <p className="text-white/40 text-sm mt-2">{t("trySearching")}</p>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    const configs = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      accepted: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      "in-progress": "bg-purple-500/20 text-purple-400 border-purple-500/50",
      completed: "bg-green-500/20 text-green-400 border-green-500/50",
      canceled: "bg-gray-500/20 text-gray-400 border-gray-500/50",
    };
    return configs[status] || configs.pending;
  };

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                {t("id")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                {type === "user" ? t("garage") : t("user")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                {t("service")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                {t("date")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                {commonT("status")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                {t("cost")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-white/60 uppercase tracking-wider">
                {commonT("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredBookings.map((booking, index) => (
              <tr
                key={booking._id}
                className="hover:bg-white/5 transition-all"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <td className="px-4 py-4 font-mono text-white/80 text-xs">
                  {booking.bookingNumber ||
                    `#${booking._id.substring(0, 8).toUpperCase()}`}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-orange flex items-center justify-center text-white text-xs font-semibold">
                      {type === "user"
                        ? booking.garage?.name?.charAt(0) || "G"
                        : booking.user?.name?.charAt(0) || "U"}
                    </div>
                    <span className="text-white/90 font-medium">
                      {type === "user"
                        ? booking.garage?.name || "Unknown Garage"
                        : booking.user?.name || "Unknown User"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-white/80">
                  {booking.service?.name ||
                    booking.description?.substring(0, 30) ||
                    "General Service"}
                </td>
                <td className="px-4 py-4 text-white/60 text-xs">
                  {formatDateTime(booking.createdAt)}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold border",
                      getStatusConfig(booking.status)
                    )}
                  >
                    {getStatusLabel(booking.status)}
                  </span>
                </td>
                <td className="px-4 py-4 font-semibold text-green-400">
                  {formatPrice(booking.estimatedCost)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {/* View Details Button */}
                    <Link
                      href={
                        type === "user"
                          ? `/user/dashboard/bookings/${booking._id}`
                          : `/garage/dashboard/bookings/${booking._id}`
                      }
                      className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                      title={t("viewDetails")}
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {/* Garage-specific action buttons */}
                    {type === "garage" &&
                      booking.status === "pending" &&
                      onStatusUpdate && (
                        <button
                          onClick={() =>
                            onStatusUpdate(booking._id, "accepted")
                          }
                          className="p-2 hover:bg-green-500/20 rounded-lg text-white/60 hover:text-green-400 transition-all"
                          title={t("accept")}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                    {type === "garage" &&
                      booking.status === "accepted" &&
                      onStatusUpdate && (
                        <button
                          onClick={() =>
                            onStatusUpdate(booking._id, "completed")
                          }
                          className="p-2 hover:bg-blue-500/20 rounded-lg text-white/60 hover:text-blue-400 transition-all"
                          title={t("markCompleted")}
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}

                    {type === "garage" &&
                      booking.status !== "completed" &&
                      booking.status !== "canceled" &&
                      onStatusUpdate && (
                        <button
                          onClick={() =>
                            onStatusUpdate(booking._id, "canceled")
                          }
                          className="p-2 hover:bg-red-500/20 rounded-lg text-white/60 hover:text-red-400 transition-all"
                          title={t("cancel")}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                    {/* User-specific action buttons */}
                    {type === "user" &&
                      booking.status !== "cancelled" &&
                      booking.status !== "completed" && (
                        <button className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-orange-400 transition-all">
                          <Phone className="w-4 h-4" />
                        </button>
                      )}
                    {type === "user" && booking.status === "pending" && (
                      <button className="p-2 hover:bg-red-500/20 rounded-lg text-white/60 hover:text-red-400 transition-all">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
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
