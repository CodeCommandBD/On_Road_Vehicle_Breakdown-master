"use client";

import { useState } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";

export default function CreatePlanModal({
  isOpen,
  onClose,
  onSave,
  planType = "user",
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tier: "standard",
    type: planType,
    currency: "BDT",
    price: {
      monthly: 0,
      yearly: 0,
    },
    benefits: [""],
    isFeatured: false,
    isActive: true,
  });

  const tierOptions = ["free", "trial", "standard", "premium", "enterprise"];

  const handleAddBenefit = () => {
    setFormData({
      ...formData,
      benefits: [...formData.benefits, ""],
    });
  };

  const handleRemoveBenefit = (index) => {
    const newBenefits = formData.benefits.filter((_, i) => i !== index);
    setFormData({ ...formData, benefits: newBenefits });
  };

  const handleBenefitChange = (index, value) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData({ ...formData, benefits: newBenefits });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty benefits
      const cleanedBenefits = formData.benefits.filter((b) => b.trim() !== "");
      await onSave({ ...formData, benefits: cleanedBenefits });

      // Reset form
      setFormData({
        name: "",
        tier: "standard",
        type: planType,
        currency: "BDT",
        price: { monthly: 0, yearly: 0 },
        benefits: [""],
        isFeatured: false,
        isActive: true,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create plan:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <div className="bg-[#1A1A1A] border border-white/20 rounded-3xl w-full max-w-2xl my-8">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Create New {planType === "user" ? "User" : "Garage"} Plan
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form Grid */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Plan Name */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">
                Plan Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                placeholder="e.g. Professional Plan"
                required
              />
            </div>

            {/* Tier */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">Tier *</label>
              <select
                value={formData.tier}
                onChange={(e) =>
                  setFormData({ ...formData, tier: e.target.value })
                }
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                required
              >
                {tierOptions.map((tier) => (
                  <option
                    key={tier}
                    value={tier}
                    className="bg-[#1A1A1A] text-white"
                  >
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  Monthly Price (৳) *
                </label>
                <input
                  type="number"
                  value={formData.price.monthly}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: {
                        ...formData.price,
                        monthly: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  Yearly Price (৳) *
                </label>
                <input
                  type="number"
                  value={formData.price.yearly}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: {
                        ...formData.price,
                        yearly: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            {/* Benefits */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/60 text-sm">Benefits</label>
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Benefit
                </button>
              </div>
              <div className="space-y-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) =>
                        handleBenefitChange(index, e.target.value)
                      }
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm"
                      placeholder="Enter benefit..."
                    />
                    {formData.benefits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(index)}
                        className="px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData({ ...formData, isFeatured: e.target.checked })
                  }
                  className="w-5 h-5"
                />
                <span className="text-white text-sm">Featured Plan</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-5 h-5"
                />
                <span className="text-white text-sm">Active</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Creating...
                </>
              ) : (
                "Create Plan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
