"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "react-toastify";

export default function GaragesSubscriptionPage() {
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    tier: "all",
    status: "all",
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [modalData, setModalData] = useState({
    membershipTier: "",
    membershipExpiry: "",
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchGarages();
  }, [pagination.page, filters]);

  const fetchGarages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.tier !== "all" && { tier: filters.tier }),
        ...(filters.status !== "all" && { status: filters.status }),
      });

      const res = await axiosInstance.get(
        `/admin/garages/subscription?${params}`,
      );
      if (res.data.success) {
        setGarages(res.data.data.garages);
        setPagination(res.data.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch garages:", error);
      toast.error("Failed to load garages");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (garage, action) => {
    setSelectedGarage(garage);
    setModalAction(action);
    setModalData({
      membershipTier: garage.membershipTier || "standard",
      membershipExpiry: garage.membershipExpiry
        ? new Date(garage.membershipExpiry).toISOString().split("T")[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
    });
    setShowModal(true);
  };

  const handleAction = async () => {
    if (!selectedGarage || !modalAction) return;

    setProcessing(true);
    try {
      const res = await axiosInstance.patch("/admin/garages/subscription", {
        garageId: selectedGarage._id,
        action: modalAction,
        ...modalData,
      });

      if (res.data.success) {
        toast.success(`Garage subscription ${modalAction}d successfully`);
        setShowModal(false);
        fetchGarages();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${modalAction} subscription`,
      );
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (garage) => {
    const now = new Date();
    const expiry = garage.membershipExpiry
      ? new Date(garage.membershipExpiry)
      : null;

    if (!garage.membershipTier || garage.membershipTier === "free") {
      return (
        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
          Free
        </span>
      );
    }

    if (expiry && expiry < now) {
      return (
        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
          <XCircle size={12} /> Expired
        </span>
      );
    }

    const daysLeft = expiry
      ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
      : 0;

    if (daysLeft <= 7) {
      return (
        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
          <Clock size={12} /> Expiring ({daysLeft}d)
        </span>
      );
    }

    return (
      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
        <CheckCircle size={12} /> Active
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="text-purple-500" />
            Garage Subscriptions
          </h1>
          <p className="text-white/60 text-sm">
            Manage all garage subscriptions and memberships
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-white/60 text-sm mb-2 block">Tier</label>
            <select
              value={filters.tier}
              onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
            >
              <option value="all" className="bg-[#1A1A1A] text-white">
                All Tiers
              </option>
              <option value="free" className="bg-[#1A1A1A] text-white">
                Free
              </option>
              <option value="trial" className="bg-[#1A1A1A] text-white">
                Trial
              </option>
              <option value="standard" className="bg-[#1A1A1A] text-white">
                Standard
              </option>
              <option value="premium" className="bg-[#1A1A1A] text-white">
                Premium
              </option>
              <option value="enterprise" className="bg-[#1A1A1A] text-white">
                Enterprise
              </option>
            </select>
          </div>
          <div>
            <label className="text-white/60 text-sm mb-2 block">Status</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
            >
              <option value="all" className="bg-[#1A1A1A] text-white">
                All Status
              </option>
              <option value="active" className="bg-[#1A1A1A] text-white">
                Active
              </option>
              <option value="expiring" className="bg-[#1A1A1A] text-white">
                Expiring Soon
              </option>
              <option value="expired" className="bg-[#1A1A1A] text-white">
                Expired
              </option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ tier: "all", status: "all" })}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/60 uppercase tracking-wider">
                  Garage
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/60 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/60 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/60 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/60 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
                  </td>
                </tr>
              ) : garages.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-white/40"
                  >
                    No garages found
                  </td>
                </tr>
              ) : (
                garages.map((garage) => (
                  <tr
                    key={garage._id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{garage.name}</p>
                        <p className="text-white/40 text-sm">{garage.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full uppercase">
                        {garage.membershipTier || "Free"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(garage)}</td>
                    <td className="px-6 py-4">
                      <p className="text-white/80 text-sm">
                        {garage.membershipExpiry
                          ? new Date(
                              garage.membershipExpiry,
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(garage, "upgrade")}
                          className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs rounded-lg transition-colors"
                        >
                          Upgrade
                        </button>
                        <button
                          onClick={() => openModal(garage, "extend")}
                          className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs rounded-lg transition-colors"
                        >
                          Extend
                        </button>
                        <button
                          onClick={() => openModal(garage, "deactivate")}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg transition-colors"
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-white/60 text-sm">
            Showing {garages.length} of {pagination.total} garages
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setPagination({ ...pagination, page: pagination.page - 1 })
              }
              disabled={pagination.page === 1}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-white text-sm">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() =>
                setPagination({ ...pagination, page: pagination.page + 1 })
              }
              disabled={pagination.page === pagination.pages}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#1A1A1A] border border-white/20 rounded-3xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 capitalize">
                {modalAction} Subscription
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Membership Tier
                  </label>
                  <select
                    value={modalData.membershipTier}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        membershipTier: e.target.value,
                      })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="free" className="bg-[#1A1A1A] text-white">
                      Free
                    </option>
                    <option value="trial" className="bg-[#1A1A1A] text-white">
                      Trial
                    </option>
                    <option
                      value="standard"
                      className="bg-[#1A1A1A] text-white"
                    >
                      Standard
                    </option>
                    <option value="premium" className="bg-[#1A1A1A] text-white">
                      Premium
                    </option>
                    <option
                      value="enterprise"
                      className="bg-[#1A1A1A] text-white"
                    >
                      Enterprise
                    </option>
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={modalData.membershipExpiry}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        membershipExpiry: e.target.value,
                      })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Processing...
                    </>
                  ) : (
                    "Confirm"
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
