"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Save,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Globe,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("footer");
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState([]);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({
    label: "",
    href: "",
    column: "company",
    order: 0,
  });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/footer-links");
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
        await axios.put(`/api/admin/footer-links/${editingLink._id}`, formData);
        toast.success("Link updated successfully");
      } else {
        await axios.post("/api/admin/footer-links", formData);
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
      await axios.delete(`/api/admin/footer-links/${id}`);
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
        {/* Add more tabs here later */}
      </div>

      {/* Content */}
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
    </div>
  );
}
