"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Building2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Crown,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Calendar,
  Loader2,
  MoreVertical,
  Download,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState("users"); // 'users' or 'garages'
  const [data, setData] = useState([]);
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
  const [search, setSearch] = useState(""); // Search state
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [modalData, setModalData] = useState({
    membershipTier: "",
    membershipExpiry: "",
  });
  const [processing, setProcessing] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [pagination.page, filters, activeTab, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pagination.limit,
        ...(filters.tier !== "all" && { tier: filters.tier }),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(search && { search }),
      });

      const endpoint =
        activeTab === "users"
          ? `/api/admin/users/subscription?${params}`
          : `/api/admin/garages/subscription?${params}`;

      const res = await axios.get(endpoint);
      if (res.data.success) {
        setData(
          activeTab === "users" ? res.data.data.users : res.data.data.garages
        );
        setPagination(res.data.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error(`Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item, action) => {
    setSelectedItem(item);
    setModalAction(action);
    setModalData({
      membershipTier: item.membershipTier || "standard",
      membershipExpiry: item.membershipExpiry
        ? new Date(item.membershipExpiry).toISOString().split("T")[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
    });
    setShowModal(true);
  };

  const handleAction = async () => {
    if (!selectedItem || !modalAction) return;

    setProcessing(true);
    try {
      const endpoint =
        activeTab === "users"
          ? "/api/admin/users/subscription"
          : "/api/admin/garages/subscription";

      const payload =
        activeTab === "users"
          ? { userId: selectedItem._id, action: modalAction, ...modalData }
          : { garageId: selectedItem._id, action: modalAction, ...modalData };

      const res = await axios.patch(endpoint, payload);

      if (res.data.success) {
        toast.success(
          `${
            activeTab === "users" ? "User" : "Garage"
          } subscription ${modalAction}d successfully`
        );
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || `Failed to ${modalAction} subscription`
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = () => {
    if (!data.length) return toast.error("No data to export");

    const headers = [
      "Name",
      "Email",
      "Tier",
      "Status",
      "Expiry Date",
      "Joined Date",
    ];

    const csvContent = [
      headers.join(","),
      ...data.map((item) => {
        const status =
          item.membershipTier === "free"
            ? "Free"
            : item.membershipExpiry &&
              new Date(item.membershipExpiry) < new Date()
            ? "Expired"
            : "Active";

        return [
          `"${item.name || "N/A"}"`,
          `"${item.email || "N/A"}"`,
          item.membershipTier || "Free",
          status,
          item.membershipExpiry
            ? new Date(item.membershipExpiry).toLocaleDateString()
            : "N/A",
          new Date(item.createdAt).toLocaleDateString(),
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${activeTab}_subscriptions_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (item) => {
    const now = new Date();
    const expiry = item.membershipExpiry
      ? new Date(item.membershipExpiry)
      : null;

    if (!item.membershipTier || item.membershipTier === "free") {
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

  const tabColor = activeTab === "users" ? "orange" : "purple";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Crown className="text-yellow-500" />
            Subscription Management
          </h1>
          <p className="text-white/60 text-sm">
            Manage all user and garage subscriptions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => {
            setActiveTab("users");
            setPagination({ ...pagination, page: 1 });
          }}
          className={`px-6 py-3 font-medium transition-all relative ${
            activeTab === "users"
              ? "text-orange-500"
              : "text-white/60 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={18} />
            User Subscriptions
          </div>
          {activeTab === "users" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("garages");
            setPagination({ ...pagination, page: 1 });
          }}
          className={`px-6 py-3 font-medium transition-all relative ${
            activeTab === "garages"
              ? "text-purple-500"
              : "text-white/60 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 size={18} />
            Garage Subscriptions
          </div>
          {activeTab === "garages" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>
          )}
        </button>
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
              {activeTab === "garages" && (
                <>
                  <option
                    value="garage_basic"
                    className="bg-[#1A1A1A] text-white"
                  >
                    Garage Basic
                  </option>
                  <option
                    value="garage_pro"
                    className="bg-[#1A1A1A] text-white"
                  >
                    Garage Pro
                  </option>
                </>
              )}
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

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            size={20}
          />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
          />
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors"
        >
          <Download size={20} />
          <span className="font-medium">Export CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/60 uppercase tracking-wider">
                  {activeTab === "users" ? "User" : "Garage"}
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
                    <Loader2
                      className={`w-8 h-8 animate-spin text-${tabColor}-500 mx-auto`}
                    />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-white/40"
                  >
                    No {activeTab} found
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-white/40 text-sm">{item.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 bg-${tabColor}-500/20 text-${tabColor}-400 text-xs rounded-full uppercase`}
                      >
                        {item.membershipTier || "Free"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item)}</td>
                    <td className="px-6 py-4">
                      <p className="text-white/80 text-sm">
                        {item.membershipExpiry
                          ? new Date(item.membershipExpiry).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            setOpenDropdown(
                              openDropdown === item._id
                                ? null
                                : {
                                    id: item._id,
                                    x: rect.right - 160,
                                    y: rect.bottom + 5,
                                  }
                            );
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <MoreVertical size={18} className="text-white/60" />
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdown?.id === item._id && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenDropdown(null)}
                            ></div>

                            {/* Dropdown Content - Fixed Position */}
                            <div
                              className="fixed z-50 bg-[#1A1A1A] border border-white/20 rounded-xl shadow-2xl min-w-[160px] overflow-hidden"
                              style={{
                                left: `${openDropdown.x}px`,
                                top: `${openDropdown.y}px`,
                              }}
                            >
                              <button
                                onClick={() => {
                                  openModal(item, "upgrade");
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-3 text-left text-green-400 hover:bg-green-500/10 transition-colors flex items-center gap-2 text-sm"
                              >
                                <CheckCircle size={16} />
                                Upgrade
                              </button>
                              <button
                                onClick={() => {
                                  openModal(item, "extend");
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-3 text-left text-blue-400 hover:bg-blue-500/10 transition-colors flex items-center gap-2 text-sm border-t border-white/10"
                              >
                                <Calendar size={16} />
                                Extend
                              </button>
                              <button
                                onClick={() => {
                                  openModal(item, "deactivate");
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-sm border-t border-white/10"
                              >
                                <XCircle size={16} />
                                Deactivate
                              </button>
                            </div>
                          </>
                        )}
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
            Showing {data.length} of {pagination.total} {activeTab}
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
                    {activeTab === "garages" && (
                      <>
                        <option
                          value="garage_basic"
                          className="bg-[#1A1A1A] text-white"
                        >
                          Garage Basic
                        </option>
                        <option
                          value="garage_pro"
                          className="bg-[#1A1A1A] text-white"
                        >
                          Garage Pro
                        </option>
                      </>
                    )}
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
                  className={`flex-1 px-4 py-3 bg-${tabColor}-500 hover:bg-${tabColor}-600 rounded-xl text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
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
