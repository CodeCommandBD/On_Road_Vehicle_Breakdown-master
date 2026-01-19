"use client";

import { useState, useEffect } from "react";
import { X, FileText, Calendar, DollarSign, Shield } from "lucide-react";
import axiosInstance from "@/lib/axios";

export default function CreateContractModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);

  const [formData, setFormData] = useState({
    userId: "",
    planId: "",
    terms: `This agreement is between the Service Provider and the Client for vehicle breakdown assistance services.

1. Service Coverage: 24/7 emergency response with nationwide network
2. Response Time: As specified in Service Level Agreement
3. Contract Duration: As specified in contract dates
4. Payment Terms: As agreed in pricing section
5. Service Scope: Emergency vehicle breakdown, towing, and roadside assistance
6. Termination: Either party may terminate with 30 days written notice
7. Liability: Service provider liability limited to service amount
8. Force Majeure: Neither party liable for delays due to circumstances beyond control`,
    customTerms: "",
    amount: "",
    currency: "BDT",
    billingCycle: "yearly",
    startDate: "",
    endDate: "",
    slaMinutes: 60,
    dedicatedSupport: false,
    customFeatures: [],
  });

  const [newFeature, setNewFeature] = useState("");
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchPlans();

      // Check URL params for pre-selected user
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get("userId");
      if (userId) {
        setFormData((prev) => ({ ...prev, userId }));
      }
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/admin/users");
      if (response.data.success) {
        setUsers(response.data.users); // Fixed: API returns users directly
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axiosInstance.get(
        "/packages?type=user&isActive=true",
      );
      if (response.data.success) {
        setPlans(response.data.data.packages);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        customFeatures: [...formData.customFeatures, newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData({
      ...formData,
      customFeatures: formData.customFeatures.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        userId: formData.userId,
        planId: formData.planId,
        terms: formData.terms,
        customTerms: formData.customTerms,
        pricing: {
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          billingCycle: formData.billingCycle,
        },
        startDate: formData.startDate,
        endDate: formData.endDate,
        metadata: {
          slaMinutes: parseInt(formData.slaMinutes),
          dedicatedSupport: formData.dedicatedSupport,
          customFeatures: formData.customFeatures,
        },
      };

      const response = await axiosInstance.post("/contracts", payload);

      if (response.data.success) {
        onSuccess?.();
        onClose();
        // Reset form
        setFormData({
          userId: "",
          planId: "",
          terms: formData.terms, // Keep default terms
          customTerms: "",
          amount: "",
          currency: "BDT",
          billingCycle: "yearly",
          startDate: "",
          endDate: "",
          slaMinutes: 60,
          dedicatedSupport: false,
          customFeatures: [],
        });
      }
    } catch (error) {
      console.error("Contract creation error:", error);
      setErrorModal({
        show: true,
        message:
          error.response?.data?.message ||
          "Failed to create contract. Please check all fields and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10 shadow-2xl my-8">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-white">
              Create Enterprise Contract
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        >
          {/* User & Plan Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Select User *
              </label>
              <select
                value={formData.userId}
                onChange={(e) =>
                  setFormData({ ...formData, userId: e.target.value })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors"
                required
              >
                <option value="" className="bg-[#1A1A1A] text-white">
                  Choose user...
                </option>
                {users.map((user) => (
                  <option
                    key={user._id}
                    value={user._id}
                    className="bg-[#1A1A1A] text-white"
                  >
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Select Plan *
              </label>
              <select
                value={formData.planId}
                onChange={(e) =>
                  setFormData({ ...formData, planId: e.target.value })
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors"
                required
              >
                <option value="" className="bg-[#1A1A1A] text-white">
                  Choose plan...
                </option>
                {plans
                  .filter((p) => p.tier === "enterprise")
                  .map((plan) => (
                    <option
                      key={plan._id}
                      value={plan._id}
                      className="bg-[#1A1A1A] text-white"
                    >
                      {plan.name} ({plan.tier})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-orange-500 mb-4">
              <DollarSign size={20} />
              <h3 className="font-bold">Pricing Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none"
                  placeholder="250000"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none"
                >
                  <option value="BDT" className="bg-[#1A1A1A] text-white">
                    BDT (৳)
                  </option>
                  <option value="USD" className="bg-[#1A1A1A] text-white">
                    USD ($)
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">
                  Billing Cycle
                </label>
                <select
                  value={formData.billingCycle}
                  onChange={(e) =>
                    setFormData({ ...formData, billingCycle: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none"
                >
                  <option value="monthly" className="bg-[#1A1A1A] text-white">
                    Monthly
                  </option>
                  <option value="yearly" className="bg-[#1A1A1A] text-white">
                    Yearly
                  </option>
                  <option value="custom" className="bg-[#1A1A1A] text-white">
                    Custom
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Contract Duration */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-orange-500 mb-4">
              <Calendar size={20} />
              <h3 className="font-bold">Contract Duration</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* SLA */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-orange-500 mb-4">
              <Shield size={20} />
              <h3 className="font-bold">Service Level Agreement</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">
                  Response Time (minutes)
                </label>
                <input
                  type="number"
                  value={formData.slaMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, slaMinutes: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none"
                  placeholder="5"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.dedicatedSupport}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dedicatedSupport: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-white/10 bg-black/40 checked:bg-orange-500"
                  />
                  <span className="text-white/80">Dedicated 24/7 Support</span>
                </label>
              </div>
            </div>
          </div>

          {/* Custom Features */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Custom Features
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddFeature())
                }
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none"
                placeholder="e.g., Custom API Access"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.customFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full flex items-center gap-2"
                >
                  <span className="text-orange-300 text-sm">{feature}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(index)}
                    className="text-orange-300 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Standard Terms & Conditions *
            </label>
            <textarea
              value={formData.terms}
              onChange={(e) =>
                setFormData({ ...formData, terms: e.target.value })
              }
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none min-h-[150px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Custom Terms (Optional)
            </label>
            <textarea
              value={formData.customTerms}
              onChange={(e) =>
                setFormData({ ...formData, customTerms: e.target.value })
              }
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none min-h-[100px]"
              placeholder="Add any special terms for this enterprise client..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-lg text-white font-medium hover:bg-white/10 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? "Creating..." : "Create Contract"}
            <FileText size={18} />
          </button>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full p-8 border border-red-500/20 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Contract Creation Failed
              </h3>
              <p className="text-white/60 mb-6">{errorModal.message}</p>
              <button
                onClick={() => setErrorModal({ show: false, message: "" })}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
