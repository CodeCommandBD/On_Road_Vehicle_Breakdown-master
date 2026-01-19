"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axios";

export default function EditServiceModal({ isOpen, onClose, onSave, service }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "mechanical",
    estimatedTime: "",
    basePrice: 0,
    icon: "wrench",
    isActive: true,
    image: "",
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const response = await axiosInstance.post("/upload", data);
      if (response.data.success) {
        setFormData((prev) => ({ ...prev, image: response.data.url }));
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const categories = [
    "mechanical",
    "electrical",
    "body-work",
    "tire-service",
    "oil-change",
    "inspection",
    "emergency",
    "other",
  ];

  const icons = [
    "wrench",
    "car",
    "cog",
    "battery",
    "droplet",
    "zap",
    "shield",
    "tool",
  ];

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        description: service.description || "",
        category: service.category || "mechanical",
        estimatedTime: service.estimatedTime || "",
        basePrice: service.basePrice || 0,
        icon: service.icon || "wrench",
        isActive: service.isActive !== undefined ? service.isActive : true,
        image: service.image || "",
      });
    }
  }, [service]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({ _id: service._id, ...formData });
      onClose();
    } catch (error) {
      console.error("Failed to update service:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <div className="bg-[#1A1A1A] border border-white/20 rounded-3xl w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Edit Service</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Service Name */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">
                Service Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                placeholder="e.g. Engine Oil Change"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white resize-none"
                rows={3}
                placeholder="Brief description of the service..."
                required
              />
            </div>

            {/* Category and Icon */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  required
                >
                  {categories.map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                      className="bg-[#1A1A1A] text-white"
                    >
                      {cat
                        .split("-")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Icon</label>
                <select
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                >
                  {icons.map((icon) => (
                    <option
                      key={icon}
                      value={icon}
                      className="bg-[#1A1A1A] text-white"
                    >
                      {icon.charAt(0).toUpperCase() + icon.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  Base Price (৳) *
                </label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      basePrice: parseFloat(e.target.value),
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
                  Estimated Time
                </label>
                <input
                  type="text"
                  value={formData.estimatedTime}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedTime: e.target.value })
                  }
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="e.g. 1-2 hours"
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-5 h-5"
                />
                <span className="text-white text-sm">
                  Active (visible to users)
                </span>
              </label>
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">
                Service Image
              </label>
              <div className="flex items-center gap-4">
                {formData.image ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/20 group">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: "" })}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/20">
                    <Loader2
                      size={24}
                      className={uploading ? "animate-spin" : "hidden"}
                    />
                    {!uploading && <span>No Img</span>}
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleImageUpload}
                    className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-500/10 file:text-orange-500 hover:file:bg-orange-500/20 cursor-pointer"
                  />
                  <p className="text-xs text-white/40 mt-1">
                    Supported: JPG, PNG, WEBP
                  </p>
                </div>
              </div>
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
                  Updating...
                </>
              ) : (
                "Update Service"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
