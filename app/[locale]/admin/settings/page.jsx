"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Edit2, Loader2, Globe, Award } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import ImageUpload from "@/components/common/ImageUpload";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("footer");
  const [loading, setLoading] = useState(false);

  // Footer Links State
  const [links, setLinks] = useState([]);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({
    label: "",
    href: "",
    column: "company",
    order: 0,
  });

  // Branding State
  const [branding, setBranding] = useState({
    sectionTitle: "",
    items: [],
  });
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: "",
    logoUrl: "",
    icon: "wrench",
    order: 0,
  });

  useEffect(() => {
    fetchLinks();
    fetchBranding();
  }, []);

  // Footer Links Functions
  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/footer-links");
      if (res.data.success) {
        setLinks(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch footer links");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLink) {
        await axiosInstance.put(
          `/admin/footer-links/${editingLink._id}`,
          formData,
        );
        toast.success("Link updated successfully");
      } else {
        await axiosInstance.post("/admin/footer-links", formData);
        toast.success("Link created successfully");
      }
      setFormData({ label: "", href: "", column: "company", order: 0 });
      setEditingLink(null);
      fetchLinks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (link) => {
    setEditingLink(link);
    setFormData({
      label: link.label,
      href: link.href,
      column: link.column,
      order: link.order,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this link?")) return;
    try {
      await axiosInstance.delete(`/admin/footer-links/${id}`);
      toast.success("Link deleted successfully");
      fetchLinks();
    } catch (error) {
      toast.error("Failed to delete link");
    }
  };

  const handleCancel = () => {
    setEditingLink(null);
    setFormData({ label: "", href: "", column: "company", order: 0 });
  };

  // Branding Functions
  const fetchBranding = async () => {
    try {
      setBrandingLoading(true);
      const res = await axiosInstance.get("/admin/branding");
      if (res.data.success) {
        setBranding(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch branding content");
    } finally {
      setBrandingLoading(false);
    }
  };

  const handleBrandingSave = async () => {
    try {
      setBrandingLoading(true);
      await axiosInstance.put("/admin/branding", branding);
      toast.success("Branding updated successfully");
      fetchBranding();
    } catch (error) {
      toast.error("Failed to update branding");
    } finally {
      setBrandingLoading(false);
    }
  };

  const handleAddPartner = () => {
    if (!newPartner.name.trim()) {
      toast.warning("Please enter partner name");
      return;
    }

    const maxOrder =
      branding.items.length > 0
        ? Math.max(...branding.items.map((item) => item.order))
        : 0;

    setBranding({
      ...branding,
      items: [
        ...branding.items,
        {
          ...newPartner,
          order: maxOrder + 1,
          isActive: true,
        },
      ],
    });
    setNewPartner({ name: "", logoUrl: "", icon: "wrench", order: 0 });
  };

  const handleRemovePartner = (index) => {
    setBranding({
      ...branding,
      items: branding.items.filter((_, i) => i !== index),
    });
  };

  const iconOptions = [
    { value: "wrench", label: "Wrench" },
    { value: "users", label: "Users" },
    { value: "tag", label: "Tag" },
    { value: "award", label: "Award" },
    { value: "shield", label: "Shield" },
    { value: "car", label: "Car" },
    { value: "tool", label: "Tool" },
    { value: "star", label: "Star" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Globe className="w-8 h-8 text-orange-500" />
          Platform Settings
        </h1>
        <p className="text-white/60 mt-2">
          Manage global settings and content for the platform.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab("footer")}
          className={`pb-4 px-2 text-sm font-medium transition-all ${
            activeTab === "footer"
              ? "text-orange-500 border-b-2 border-orange-500"
              : "text-white/60 hover:text-white"
          }`}
        >
          Footer Content
        </button>
        <button
          onClick={() => setActiveTab("branding")}
          className={`pb-4 px-2 text-sm font-medium transition-all ${
            activeTab === "branding"
              ? "text-orange-500 border-b-2 border-orange-500"
              : "text-white/60 hover:text-white"
          }`}
        >
          Branding Content
        </button>
      </div>

      {/* Footer Content Tab */}
      {activeTab === "footer" && (
        <div className="grid lg:grid-cols-[400px_1fr] gap-8">
          {/* Form */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 h-fit">
            <h3 className="text-lg font-bold text-white mb-6">
              {editingLink ? "Edit Link" : "Add New Link"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  placeholder="e.g. About Us"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  URL Path
                </label>
                <input
                  type="text"
                  required
                  value={formData.href}
                  onChange={(e) =>
                    setFormData({ ...formData, href: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  placeholder="e.g. /about"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    Column
                  </label>
                  <select
                    value={formData.column}
                    onChange={(e) =>
                      setFormData({ ...formData, column: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="company">Company</option>
                    <option value="services">Services</option>
                    <option value="discover">Discover</option>
                    <option value="help">Help Center</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  {editingLink ? (
                    <>
                      <Save className="w-4 h-4" /> Update
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Add Link
                    </>
                  )}
                </button>
                {editingLink && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div className="space-y-6">
            {["company", "services", "discover", "help"].map((col) => {
              const colLinks = links.filter((l) => l.column === col);
              if (colLinks.length === 0) return null;

              return (
                <div
                  key={col}
                  className="bg-slate-900/30 border border-white/10 rounded-2xl p-6"
                >
                  <h4 className="text-lg font-bold text-white capitalize mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    {col} Column
                  </h4>
                  <div className="space-y-3">
                    {colLinks.map((link) => (
                      <div
                        key={link._id}
                        className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div>
                          <p className="text-white font-medium">{link.label}</p>
                          <p className="text-xs text-white/40">{link.href}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(link)}
                            className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(link._id)}
                            className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {links.length === 0 && !loading && (
              <div className="text-center py-12 text-white/40">
                <p>No footer links found. Add one to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Branding Content Tab */}
      {activeTab === "branding" && (
        <div className="space-y-6">
          {/* Section Title */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" />
              Section Title
            </h3>
            <input
              type="text"
              value={branding.sectionTitle}
              onChange={(e) =>
                setBranding({ ...branding, sectionTitle: e.target.value })
              }
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
              placeholder="e.g. Trusted by top automotive partners"
            />
          </div>

          {/* Partner Items */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Partner Items</h3>

            {/* Current Partners */}
            <div className="space-y-3 mb-6">
              {branding.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    {item.logoUrl ? (
                      <img
                        src={item.logoUrl}
                        alt={item.name}
                        className="w-10 h-10 object-contain rounded bg-white/5 p-1"
                      />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded">
                        <span className="text-xs text-white/60">
                          {item.icon}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-white font-medium">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-white/40">
                          #{item.order}
                        </span>
                        {item.logoUrl && (
                          <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                            Has Logo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePartner(index)}
                    className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Partner */}
            <div className="border-t border-white/10 pt-6">
              <p className="text-sm font-bold text-white/80 mb-3">
                Add New Partner
              </p>
              <div className="space-y-4">
                {/* Partner Name */}
                <input
                  type="text"
                  placeholder="Partner Name"
                  value={newPartner.name}
                  onChange={(e) =>
                    setNewPartner({ ...newPartner, name: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 placeholder:text-white/40"
                />

                {/* Logo Upload */}
                <ImageUpload
                  label="Partner Logo (Optional)"
                  value={newPartner.logoUrl}
                  onChange={(url) =>
                    setNewPartner({ ...newPartner, logoUrl: url })
                  }
                  placeholder="Upload logo or paste URL"
                  accept="image/*"
                  showPreview={true}
                />

                {/* Icon and Add Button */}
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newPartner.icon}
                    onChange={(e) =>
                      setNewPartner({ ...newPartner, icon: e.target.value })
                    }
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  >
                    {iconOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddPartner}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                <p className="text-xs text-white/40 italic">
                  * Logo will be displayed if uploaded, otherwise the selected
                  icon will be shown
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleBrandingSave}
              disabled={brandingLoading}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {brandingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Branding Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
