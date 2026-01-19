"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Wrench,
  Filter,
} from "lucide-react";
import CreateServiceModal from "./CreateServiceModal";
import EditServiceModal from "./EditServiceModal";
import { toast } from "react-toastify";

export default function ServiceList() {
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedServices, setSelectedServices] = useState([]);

  // Fetch Services
  const { data: servicesData, isLoading: loading } = useQuery({
    queryKey: ["adminServices"],
    queryFn: async () => {
      const response = await axiosInstance.get("/admin/services");
      return response.data.data.services || [];
    },
  });

  const services = servicesData || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (newService) => {
      const response = await axiosInstance.post("/admin/services", newService);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Service created successfully");
      queryClient.invalidateQueries({ queryKey: ["adminServices"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create service");
    },
  });

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: async (updatedData) => {
      const response = await axiosInstance.put("/admin/services", updatedData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Service updated successfully");
      queryClient.invalidateQueries({ queryKey: ["adminServices"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update service");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (serviceId) => {
      const response = await axiosInstance.delete(
        `/admin/services?id=${serviceId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Service deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminServices"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete service");
    },
  });

  // Toggle Active Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ serviceId, currentStatus }) => {
      const response = await axiosInstance.patch(
        `/admin/services?id=${serviceId}`,
      );
      return { response: response.data, currentStatus };
    },
    onSuccess: ({ currentStatus }) => {
      toast.success(
        `Service ${currentStatus ? "deactivated" : "activated"} successfully`,
      );
      queryClient.invalidateQueries({ queryKey: ["adminServices"] });
    },
    onError: () => {
      toast.error("Failed to toggle service status");
    },
  });

  // Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(
        ids.map((id) => axiosInstance.delete(`/admin/services?id=${id}`)),
      );
    },
    onSuccess: () => {
      toast.success("Selected services deleted");
      setSelectedServices([]);
      queryClient.invalidateQueries({ queryKey: ["adminServices"] });
    },
    onError: () => {
      toast.error("Failed to delete some services");
    },
  });

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "mechanical", label: "Mechanical" },
    { value: "electrical", label: "Electrical" },
    { value: "body-work", label: "Body Work" },
    { value: "tire-service", label: "Tire Service" },
    { value: "oil-change", label: "Oil Change" },
    { value: "inspection", label: "Inspection" },
    { value: "emergency", label: "Emergency" },
    { value: "other", label: "Other" },
  ];

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setIsEditModalOpen(true);
  };

  const handleSaveCreate = async (newServiceData) => {
    await createMutation.mutateAsync(newServiceData);
  };

  const handleSaveEdit = async (updatedData) => {
    await editMutation.mutateAsync(updatedData);
  };

  const handleDelete = async (serviceId, serviceName) => {
    if (
      !confirm(
        `Are you sure you want to delete "${serviceName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(serviceId);
  };

  const handleSelect = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedServices(filteredServices.map((s) => s._id));
    } else {
      setSelectedServices([]);
    }
  };

  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedServices.length} services?`,
      )
    )
      return;
    bulkDeleteMutation.mutate(selectedServices);
  };

  // Filter services
  const filteredServices = services.filter((service) => {
    const matchesCategory =
      filterCategory === "all" || service.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && service.isActive) ||
      (filterStatus === "inactive" && !service.isActive);
    return matchesCategory && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="text-orange-500" />
            Service Management
          </h1>
          <p className="text-white/60 text-sm">
            Manage all services offered by garages
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-colors"
        >
          <Plus size={20} />
          Add New Service
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-white/60" />
          <span className="text-white/60 text-sm font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-white/60 text-xs mb-2 block">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm"
            >
              {categories.map((cat) => (
                <option
                  key={cat.value}
                  value={cat.value}
                  className="bg-[#1A1A1A] text-white"
                >
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-white/60 text-xs mb-2 block">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm"
            >
              <option value="all" className="bg-[#1A1A1A] text-white">
                All Status
              </option>
              <option value="active" className="bg-[#1A1A1A] text-white">
                Active Only
              </option>
              <option value="inactive" className="bg-[#1A1A1A] text-white">
                Inactive Only
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 bg-white/5 rounded-2xl animate-pulse flex items-center justify-center"
            >
              <Wrench className="w-12 h-12 text-white/5 animate-spin" />
            </div>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
          <Wrench className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 mb-4">
            {services.length === 0
              ? "No services found"
              : "No services match your filters"}
          </p>
          {services.length === 0 && (
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-colors"
            >
              Add First Service
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service._id}
              className={`group relative bg-[#0a0a0a] border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                service.isActive
                  ? "border-white/10 hover:border-orange-500/50 hover:shadow-orange-500/10"
                  : "border-red-500/30 opacity-60"
              }`}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    service.isActive
                      ? "bg-green-500/20 text-green-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {service.isActive ? "Active" : "Inactive"}
                </div>
              </div>

              {/* Selection Checkbox */}
              <div className="absolute top-4 left-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service._id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelect(service._id);
                  }}
                  className="w-5 h-5 rounded border-white/20 bg-black/50 checked:bg-orange-500 cursor-pointer"
                />
              </div>

              {/* Service Image or Icon */}
              <div className="mb-4 aspect-video rounded-xl bg-white/5 overflow-hidden relative">
                {service.image ? (
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/10">
                    <Wrench size={48} />
                  </div>
                )}
                {/* Category Badge overlay */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white uppercase font-bold tracking-wider">
                  {service.category?.split("-").join(" ")}
                </div>
              </div>

              {/* Info */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
                  {service.name}
                </h3>
              </div>

              {/* Description */}
              <p className="text-white/60 text-sm mb-4 line-clamp-2">
                {service.description}
              </p>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Base Price:</span>
                  <span className="text-orange-500 font-bold">
                    ৳{service.basePrice}
                  </span>
                </div>
                {service.estimatedTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Est. Time:</span>
                    <span className="text-white/60">
                      {service.estimatedTime}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      handleToggleActive(service._id, service.isActive)
                    }
                    className={`group/activebtn relative flex items-center justify-center gap-2 font-medium py-2 rounded-lg transition-all border text-xs ${
                      service.isActive
                        ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
                        : "bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                    }`}
                  >
                    {service.isActive ? (
                      <ToggleRight size={20} />
                    ) : (
                      <ToggleLeft size={20} />
                    )}

                    {/* Tooltip */}
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1A1A1A]/90 backdrop-blur-md border border-white/10 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/activebtn:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">
                      {service.isActive
                        ? "Deactivate Service"
                        : "Activate Service"}
                    </span>
                  </button>
                  <button
                    onClick={() => handleEdit(service)}
                    className="group/editbtn relative flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium py-2 rounded-lg transition-all border border-blue-500/30 text-xs"
                  >
                    <Edit2 size={20} />

                    {/* Tooltip */}
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1A1A1A]/90 backdrop-blur-md border border-white/10 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/editbtn:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">
                      Edit Service
                    </span>
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(service._id, service.name)}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium py-2 rounded-lg transition-all border border-red-500/30 text-xs"
                >
                  <Trash2 size={14} />
                  Delete Service
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {!loading && services.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/40">
          <span>Total: {services.length}</span>
          <span>Active: {services.filter((s) => s.isActive).length}</span>
          <span>Inactive: {services.filter((s) => !s.isActive).length}</span>
        </div>
      )}

      <CreateServiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveCreate}
      />

      <EditServiceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        service={selectedService}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
