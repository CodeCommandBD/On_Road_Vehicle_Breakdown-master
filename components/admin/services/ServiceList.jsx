"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Wrench,
  Battery,
  Droplets,
  Zap,
  Car,
  Gauge,
  Wind,
  Lock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

// Icon mapping
const iconMap = {
  Wrench,
  Battery,
  Droplets,
  Zap,
  Car,
  Gauge,
  Wind,
  Lock,
  AlertCircle,
};

const categories = [
  "general",
  "engine",
  "electrical",
  "tire",
  "battery",
  "fuel",
  "towing",
  "lockout",
  "ac",
  "brake",
  "other",
];

export default function ServiceList() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    basePrice: "",
    icon: "Wrench",
    category: "general",
    description: "",
    isActive: true,
    image: null,
  });
  const [editingId, setEditingId] = useState(null);

  const fetchServices = async () => {
    try {
      const response = await axios.get("/api/services?limit=100");
      if (response.data.success) {
        setServices(response.data.data.services);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load services");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      basePrice: "",
      icon: "Wrench",
      category: "general",
      description: "",
      isActive: true,
      image: null,
    });
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (service) => {
    setFormData({
      name: service.name,
      basePrice: service.basePrice,
      icon: service.icon || "Wrench",
      category: service.category || "general",
      description: service.description || "",
      isActive: service.isActive,
      image: service.image || null,
    });
    setEditingId(service._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.basePrice) {
      toast.warning("Name and Price are required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Update
        const response = await axios.put(
          `/api/services/${editingId}`,
          formData
        );
        if (response.data.success) {
          toast.success("Service updated successfully");
          fetchServices();
          setIsModalOpen(false);
        }
      } else {
        // Create
        const response = await axios.post("/api/services", formData);
        if (response.data.success) {
          toast.success("Service created successfully");
          fetchServices();
          setIsModalOpen(false);
        }
      }
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error(error.response?.data?.message || "Failed to save service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this service? This may affect existing bookings."
      )
    )
      return;

    try {
      const response = await axios.delete(`/api/services/${id}`);
      if (response.data.success) {
        toast.success("Service deleted");
        setServices(services.filter((s) => s._id !== id));
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete service");
    }
  };

  const toggleStatus = async (service) => {
    try {
      const newStatus = !service.isActive;
      // Optimistic update
      setServices((prev) =>
        prev.map((s) =>
          s._id === service._id ? { ...s, isActive: newStatus } : s
        )
      );

      await axios.patch(`/api/services/${service._id}`, {
        isActive: newStatus,
      });
      toast.success(`Service ${newStatus ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update status");
      fetchServices(); // Revert on error
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add New Card */}
        <button
          onClick={openAddModal}
          className="border border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-white/5 transition-colors group min-h-[250px]"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-[#FF532D] transition-colors">
            <Plus size={24} />
          </div>
          <span className="text-white font-medium">Add New Service</span>
        </button>

        {/* Service Cards */}
        {services.map((service) => {
          const Icon = iconMap[service.icon] || Wrench;
          return (
            <div
              key={service._id}
              className={`bg-[#1E1E1E] rounded-xl border p-6 relative group transition-all ${
                service.isActive
                  ? "border-white/5"
                  : "border-red-500/20 opacity-70"
              }`}
            >
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={() => openEditModal(service)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(service._id)}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="w-12 h-12 rounded-lg bg-[#FF532D]/10 text-[#FF532D] flex items-center justify-center mb-4">
                <Icon size={24} />
              </div>

              <h3 className="text-lg font-bold text-white mb-1">
                {service.name}
              </h3>
              <p className="text-white/60 text-sm mb-2">{service.category}</p>
              <p className="text-xl font-bold text-white mb-4">
                ৳{service.basePrice}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <button
                  onClick={() => toggleStatus(service)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    service.isActive
                      ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                  }`}
                >
                  {service.isActive ? "Active" : "Inactive"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#1E1E1E] w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingId ? "Edit Service" : "Add New Service"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#FF532D]"
                  placeholder="e.g. Engine Repair"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">
                  Category
                </label>
                <select
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#FF532D]"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">
                  Base Price (৳)
                </label>
                <input
                  type="number"
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#FF532D]"
                  placeholder="e.g. 500"
                  value={formData.basePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, basePrice: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#FF532D] resize-none h-20"
                  placeholder="Brief description..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">Icon</label>
                <div className="grid grid-cols-5 gap-2 bg-black/20 p-2 rounded-lg border border-white/10">
                  {Object.keys(iconMap).map((iconName) => {
                    const Ico = iconMap[iconName];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, icon: iconName })
                        }
                        className={`p-2 rounded flex items-center justify-center transition-colors ${
                          formData.icon === iconName
                            ? "bg-orange-500 text-white"
                            : "text-white/40 hover:bg-white/10"
                        }`}
                        title={iconName}
                      >
                        <Ico size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">
                  Service Image (for Navbar)
                </label>
                <div className="grid grid-cols-4 gap-2 bg-black/20 p-2 rounded-lg border border-white/10 h-40 overflow-y-auto custom-scrollbar">
                  {[
                    "nav-one.png",
                    "nav-two.png",
                    "nav-three.png",
                    "nav-four.png",
                    "nav-five.png",
                    "nav-six.png",
                    "nav-seven.png",
                    "nav-eight.png",
                    "nav-nine.png",
                    "nav-ten.png",
                    "nav-eleven.png",
                    "nav-twelve.png",
                  ].map((img) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          image: `/images/nav/${img}`,
                        })
                      }
                      className={`p-1 rounded flex items-center justify-center transition-all border-2 ${
                        formData.image === `/images/nav/${img}`
                          ? "border-orange-500 bg-orange-500/20"
                          : "border-transparent hover:bg-white/10"
                      }`}
                    >
                      <img
                        src={`/images/nav/${img}`}
                        alt={img}
                        className="w-full h-auto object-contain"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-2 rounded-lg bg-[#FF532D] text-white font-medium hover:bg-[#F23C13] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
