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
  RotateCcw,
  MoreVertical,
  MapPin,
  Star,
} from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { selectSearchTerm } from "@/store/slices/uiSlice";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";

export default function BookingTable({
  type = "user",
  bookings = [],
  onStatusUpdate,
  team = [],
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
    <div className="overflow-visible">
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
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="text-white/60 text-xs">
                      {formatDateTime(booking.createdAt)}
                    </span>
                    {booking.priority === "critical" && (
                      <div className="flex items-center gap-1 mt-1 text-red-500 text-[10px] font-bold uppercase animate-pulse">
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                        VIP CRITICAL
                      </div>
                    )}
                    {booking.priority === "high" && (
                      <span className="text-orange-400 text-[10px] font-bold uppercase mt-1">
                        HIGH PRIORITY
                      </span>
                    )}
                    {booking.slaDeadline &&
                      new Date(booking.slaDeadline) > new Date() &&
                      booking.status === "pending" && (
                        <div className="text-[10px] text-yellow-400 font-mono mt-1">
                          Due:{" "}
                          {new Date(booking.slaDeadline).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </div>
                      )}
                  </div>
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
                  {type === "user" ? (
                    <UserBookingActions booking={booking} t={t} />
                  ) : (
                    <GarageBookingActions
                      booking={booking}
                      onStatusUpdate={onStatusUpdate}
                      team={team}
                      t={t}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// User Booking Actions Dropdown Component
function UserBookingActions({ booking, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useState(null);

  const handleToggle = (e) => {
    if (!isOpen) {
      const rect = e.currentTarget.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 5,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex items-center justify-end">
      <button
        onClick={handleToggle}
        className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
        title="More actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => setIsOpen(false)}
            />
            <div
              className="fixed z-[200] bg-[#1E1E1E] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[180px]"
              style={{
                top: `${position.top}px`,
                right: `${position.right}px`,
              }}
            >
              <Link
                href={`/user/dashboard/bookings/${booking._id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-white/80 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">View Details</span>
              </Link>

              {booking.status !== "cancelled" &&
                booking.status !== "completed" && (
                  <>
                    <Link
                      href={`/user/dashboard/bookings/${booking._id}/track`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-white/80 hover:text-white"
                      onClick={() => setIsOpen(false)}
                    >
                      <MapPin className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium">Track Service</span>
                    </Link>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-white/80 hover:text-white"
                      onClick={() => setIsOpen(false)}
                    >
                      <Phone className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-medium">Call Garage</span>
                    </button>
                  </>
                )}

              {booking.status === "pending" && (
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-all text-red-400 hover:text-red-300"
                  onClick={() => setIsOpen(false)}
                >
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Cancel Booking</span>
                </button>
              )}

              {booking.status === "completed" && (
                <>
                  <Link
                    href={`/book?rebook=${booking._id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-white/80 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <RotateCcw className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium">Re-book Service</span>
                  </Link>
                  <Link
                    href={`/user/dashboard/bookings/${booking._id}?review=true`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-white/80 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">Write Review</span>
                  </Link>
                </>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

// Garage Booking Actions Dropdown Component
function GarageBookingActions({ booking, onStatusUpdate, team, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  const handleToggle = (e) => {
    if (!isOpen) {
      const rect = e.currentTarget.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 5,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(!isOpen);
  };

  const handleAssign = async (mechanicId) => {
    try {
      const response = await fetch(`/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedMechanic: mechanicId }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Mechanic assigned successfully");
        setShowAssignModal(false);
        if (onStatusUpdate) onStatusUpdate(booking._id, "confirmed");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to assign mechanic");
    }
  };

  return (
    <div className="flex items-center justify-end">
      <button
        onClick={handleToggle}
        className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
        title="More actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => setIsOpen(false)}
            />
            <div
              className="fixed z-[200] bg-[#1E1E1E] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[180px]"
              style={{
                top: `${position.top}px`,
                right: `${position.right}px`,
              }}
            >
              <Link
                href={`/garage/dashboard/bookings/${booking._id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-white/80 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">{t("viewDetails")}</span>
              </Link>

              {booking.status === "pending" && (
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-white/80 hover:text-white"
                  onClick={() => {
                    setShowAssignModal(true);
                    setIsOpen(false);
                  }}
                >
                  <Package className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-medium">Assign Mechanic</span>
                </button>
              )}

              {booking.status === "pending" && onStatusUpdate && (
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-white/80 hover:text-white"
                  onClick={() => {
                    onStatusUpdate(booking._id, "accepted");
                    setIsOpen(false);
                  }}
                >
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium">{t("accept")}</span>
                </button>
              )}

              {booking.status === "accepted" && onStatusUpdate && (
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-white/80 hover:text-white"
                  onClick={() => {
                    onStatusUpdate(booking._id, "completed");
                    setIsOpen(false);
                  }}
                >
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium">
                    {t("markCompleted")}
                  </span>
                </button>
              )}

              {booking.status !== "completed" &&
                booking.status !== "canceled" &&
                onStatusUpdate && (
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-all text-red-400 hover:text-red-300"
                    onClick={() => {
                      onStatusUpdate(booking._id, "canceled");
                      setIsOpen(false);
                    }}
                  >
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{t("cancel")}</span>
                  </button>
                )}
            </div>
          </>,
          document.body
        )}

      {/* Mechanic Assignment Modal */}
      {showAssignModal &&
        createPortal(
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white leading-tight">
                  Assign Mechanic
                </h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 max-h-[400px] overflow-y-auto">
                <div className="space-y-3">
                  {team.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-white/40 italic">No mechanics found</p>
                      <Link
                        href="/garage/dashboard/team"
                        className="text-primary text-sm hover:underline mt-2 inline-block"
                      >
                        Add your team first
                      </Link>
                    </div>
                  ) : (
                    team.map((member) => (
                      <button
                        key={member._id}
                        onClick={() => handleAssign(member.user._id)}
                        className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-orange-500/50 transition-all text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-primary font-bold text-lg">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-primary transition-colors">
                              {member.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  member.user?.availability?.status === "online"
                                    ? "bg-green-500"
                                    : "bg-gray-500"
                                }`}
                              />
                              <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                                {member.user?.availability?.status || "offline"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-orange-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <Check className="w-5 h-5" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
