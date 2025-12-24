"use client";

import { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Percent,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export default function CouponManagementPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    maxDiscount: null,
    minPurchase: 0,
    usageLimit: null,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    applicableTo: "all",
    applicableTiers: [],
    isActive: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/coupons");
      if (res.data.success) {
        setCoupons(res.data.data.coupons);
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      maxDiscount: null,
      minPurchase: 0,
      usageLimit: null,
      validFrom: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      applicableTo: "all",
      applicableTiers: [],
      isActive: true,
    });
    setEditingCoupon(null);
  };

  const openModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        ...coupon,
        validFrom: new Date(coupon.validFrom).toISOString().split("T")[0],
        validUntil: new Date(coupon.validUntil).toISOString().split("T")[0],
        applicableTiers: coupon.applicableTiers || [],
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      if (editingCoupon) {
        // Update
        const res = await axios.patch("/api/admin/coupons", {
          couponId: editingCoupon._id,
          ...formData,
        });
        if (res.data.success) {
          toast.success("Coupon updated successfully");
        }
      } else {
        // Create
        const res = await axios.post("/api/admin/coupons", formData);
        if (res.data.success) {
          toast.success("Coupon created successfully");
        }
      }
      setShowModal(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save coupon");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (couponId) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const res = await axios.delete(`/api/admin/coupons?id=${couponId}`);
      if (res.data.success) {
        toast.success("Coupon deleted successfully");
        fetchCoupons();
      }
    } catch (error) {
      toast.error("Failed to delete coupon");
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      const res = await axios.patch("/api/admin/coupons", {
        couponId: coupon._id,
        isActive: !coupon.isActive,
      });
      if (res.data.success) {
        toast.success(
          `Coupon ${!coupon.isActive ? "activated" : "deactivated"}`
        );
        fetchCoupons();
      }
    } catch (error) {
      toast.error("Failed to update coupon status");
    }
  };

  const isExpired = (coupon) => {
    return new Date(coupon.validUntil) < new Date();
  };

  const isValid = (coupon) => {
    const now = new Date();
    return (
      coupon.isActive &&
      new Date(coupon.validFrom) <= now &&
      new Date(coupon.validUntil) >= now &&
      (coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="text-orange-500" />
            Coupon Management
          </h1>
          <p className="text-white/60 text-sm">
            Create and manage promotional discount codes
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-colors"
        >
          <Plus size={20} />
          Create Coupon
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Coupons</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {coupons.length}
              </h3>
            </div>
            <Tag className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Active Coupons</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {coupons.filter((c) => isValid(c)).length}
              </h3>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Expired</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {coupons.filter((c) => isExpired(c)).length}
              </h3>
            </div>
            <XCircle className="text-red-500" size={32} />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Usage</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0)}
              </h3>
            </div>
            <TrendingUp className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/60 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/60 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/60 uppercase tracking-wider">
                  Valid Period
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/60 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/60 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/60 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-white/40"
                  >
                    No coupons found. Create your first coupon!
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr
                    key={coupon._id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-mono font-bold">
                          {coupon.code}
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                          {coupon.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {coupon.discountType === "percentage" ? (
                          <Percent className="text-green-500" size={16} />
                        ) : (
                          <DollarSign className="text-blue-500" size={16} />
                        )}
                        <span className="text-white font-bold">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}%`
                            : `৳${coupon.discountValue}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-white/80">
                          {new Date(coupon.validFrom).toLocaleDateString()}
                        </p>
                        <p className="text-white/40">
                          to {new Date(coupon.validUntil).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">
                        {coupon.usageCount || 0}
                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {isValid(coupon) ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1 w-fit">
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : isExpired(coupon) ? (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1 w-fit">
                          <XCircle size={12} /> Expired
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full flex items-center gap-1 w-fit">
                          <XCircle size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(coupon)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            coupon.isActive
                              ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400"
                              : "bg-green-500/20 hover:bg-green-500/30 text-green-400"
                          }`}
                        >
                          {coupon.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => openModal(coupon)}
                          className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs rounded-lg transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon._id)}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
          <div className="bg-[#1A1A1A] border border-white/20 rounded-3xl w-full max-w-2xl my-8">
            <form onSubmit={handleSubmit} className="p-6">
              <h3 className="text-2xl font-bold text-white mb-6">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code */}
                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-mono"
                    placeholder="SUMMER25"
                    required
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    required
                  >
                    <option
                      value="percentage"
                      className="bg-[#1A1A1A] text-white"
                    >
                      Percentage (%)
                    </option>
                    <option value="fixed" className="bg-[#1A1A1A] text-white">
                      Fixed Amount (৳)
                    </option>
                  </select>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="text-white/60 text-sm mb-2 block">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    placeholder="Summer Sale - 25% off"
                    required
                  />
                </div>

                {/* Discount Value */}
                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {/* Max Discount (for percentage) */}
                {formData.discountType === "percentage" && (
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">
                      Max Discount (৳)
                    </label>
                    <input
                      type="number"
                      value={formData.maxDiscount || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxDiscount: e.target.value
                            ? parseFloat(e.target.value)
                            : null,
                        })
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                      placeholder="Optional"
                    />
                  </div>
                )}

                {/* Min Purchase */}
                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Minimum Purchase (৳)
                  </label>
                  <input
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minPurchase: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    min="0"
                  />
                </div>

                {/* Usage Limit */}
                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usageLimit: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    placeholder="Unlimited"
                  />
                </div>

                {/* Valid From */}
                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) =>
                      setFormData({ ...formData, validFrom: e.target.value })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    required
                  />
                </div>

                {/* Valid Until */}
                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData({ ...formData, validUntil: e.target.value })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    required
                  />
                </div>

                {/* Applicable To */}
                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Applicable To
                  </label>
                  <select
                    value={formData.applicableTo}
                    onChange={(e) =>
                      setFormData({ ...formData, applicableTo: e.target.value })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="all" className="bg-[#1A1A1A] text-white">
                      All (User & Garage)
                    </option>
                    <option value="user" className="bg-[#1A1A1A] text-white">
                      Users Only
                    </option>
                    <option value="garage" className="bg-[#1A1A1A] text-white">
                      Garages Only
                    </option>
                  </select>
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-5 h-5"
                    />
                    <span className="text-white">Active</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      {editingCoupon ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editingCoupon ? "Update" : "Create"} Coupon</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
