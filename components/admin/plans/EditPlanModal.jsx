"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";

export default function EditPlanModal({ isOpen, onClose, plan, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    price: { monthly: 0, yearly: 0 },
    benefits: [],
    currency: "BDT",
    tier: "",
    type: "user",
    promoEndsAt: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData({
        _id: plan._id,
        name: plan.name || "",
        price: plan.price || { monthly: 0, yearly: 0 },
        benefits: plan.benefits || [],
        currency: plan.currency || "BDT",
        tier: plan.tier || "",
        type: plan.type || "user",
        promoEndsAt: plan.promoEndsAt
          ? new Date(plan.promoEndsAt).toISOString().slice(0, 16)
          : "",
      });
    }
  }, [plan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const addBenefit = () => {
    setFormData({ ...formData, benefits: [...formData.benefits, ""] });
  };

  const removeBenefit = (index) => {
    const newBenefits = formData.benefits.filter((_, i) => i !== index);
    setFormData({ ...formData, benefits: newBenefits });
  };

  const updateBenefit = (index, value) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData({ ...formData, benefits: newBenefits });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold text-white">
            Edit Plan: {formData.tier.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form
            id="edit-plan-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 outline-none transition-colors"
                >
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            {/* Plan Type & Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Plan Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 outline-none transition-colors"
                >
                  <option value="user">User Plan</option>
                  <option value="garage">Garage Plan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Promo End Date (Timer)
                </label>
                <input
                  type="datetime-local"
                  value={formData.promoEndsAt}
                  onChange={(e) =>
                    setFormData({ ...formData, promoEndsAt: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 outline-none transition-colors"
                />
                <p className="text-xs text-white/40 mt-1">
                  Leave empty to disable timer
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Monthly Price
                </label>
                <input
                  type="number"
                  value={formData.price.monthly}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: {
                        ...formData.price,
                        monthly: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Yearly Price
                </label>
                <input
                  type="number"
                  value={formData.price.yearly}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: {
                        ...formData.price,
                        yearly: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Benefits */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-white/60">
                  Benefits / Features
                </label>
                <button
                  type="button"
                  onClick={addBenefit}
                  className="flex items-center gap-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md transition-colors"
                >
                  <Plus size={14} /> Add Benefit
                </button>
              </div>

              <div className="space-y-3">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none transition-colors text-sm"
                      placeholder="e.g. 24/7 Support"
                    />
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="p-2 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-white font-medium hover:bg-white/10 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-plan-form"
            className="px-6 py-2.5 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
