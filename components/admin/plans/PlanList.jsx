"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import {
  DollarSign,
  Check,
  Edit2,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Star,
  Loader2,
} from "lucide-react";
import EditPlanModal from "./EditPlanModal";
import CreatePlanModal from "./CreatePlanModal";
import { toast } from "react-toastify";

export default function PlanList() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("user");

  // Fetch Plans
  const { data: plansData, isLoading: loading } = useQuery({
    queryKey: ["adminPlans", activeTab],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/api/packages?sort=order&type=${activeTab}`,
      );
      return response.data.data.packages || [];
    },
  });

  const plans = plansData || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (newPlan) => {
      const response = await axiosInstance.post("/api/packages", newPlan);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Plan created successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPlans"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create plan");
    },
  });

  const editMutation = useMutation({
    mutationFn: async (updatedData) => {
      const response = await axiosInstance.put("/api/packages", updatedData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Plan updated successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPlans"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update plan");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (planId) => {
      const response = await axiosInstance.delete(`/api/packages?id=${planId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Plan deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPlans"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete plan");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ planId, currentStatus }) => {
      const response = await axiosInstance.patch(
        `/api/packages?id=${planId}&action=toggle-active`,
      );
      return { response: response.data, currentStatus };
    },
    onSuccess: ({ currentStatus }) => {
      toast.success(
        `Plan ${currentStatus ? "deactivated" : "activated"} successfully`,
      );
      queryClient.invalidateQueries({ queryKey: ["adminPlans"] });
    },
    onError: () => {
      toast.error("Failed to toggle plan status");
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ planId, isFeatured }) => {
      const response = await axiosInstance.patch(
        `/api/packages?id=${planId}&action=toggle-featured`,
      );
      return { response: response.data, isFeatured };
    },
    onSuccess: ({ isFeatured }) => {
      toast.success(`Plan ${isFeatured ? "unmarked" : "marked"} as featured`);
      queryClient.invalidateQueries({ queryKey: ["adminPlans"] });
    },
    onError: () => {
      toast.error("Failed to toggle featured status");
    },
  });

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setIsEditModalOpen(true);
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleSaveEdit = async (updatedData) => {
    await editMutation.mutateAsync(updatedData);
  };

  const handleSaveCreate = async (newPlanData) => {
    await createMutation.mutateAsync(newPlanData);
  };

  const handleDelete = async (planId, planName) => {
    if (
      !confirm(
        `Are you sure you want to delete "${planName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(planId);
  };

  const handleToggleActive = async (planId, currentStatus) => {
    toggleActiveMutation.mutate({ planId, currentStatus });
  };

  const handleToggleFeatured = async (planId, currentStatus) => {
    const isFeatured = currentStatus === true;
    toggleFeaturedMutation.mutate({ planId, isFeatured });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="text-orange-500" />
            Package Management
          </h1>
          <p className="text-white/60 text-sm">
            Manage subscription plans for users and garages
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-colors"
        >
          <Plus size={20} />
          Create New Plan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-white/10">
        <button
          onClick={() => setActiveTab("user")}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
            activeTab === "user"
              ? "text-orange-500"
              : "text-white/60 hover:text-white"
          }`}
        >
          User Plans
          {activeTab === "user" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("garage")}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
            activeTab === "garage"
              ? "text-orange-500"
              : "text-white/60 hover:text-white"
          }`}
        >
          Garage Plans
          {activeTab === "garage" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500" />
          )}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-96 bg-white/5 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/40 mb-4">No plans found for {activeTab}s</p>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-colors"
          >
            Create First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`group relative bg-[#0a0a0a] border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                plan.isFeatured
                  ? "border-yellow-500/50 shadow-lg shadow-yellow-500/20"
                  : plan.isActive
                    ? "border-white/10 hover:border-orange-500/50 hover:shadow-orange-500/10"
                    : "border-red-500/30 opacity-60"
              }`}
            >
              {/* Featured Badge */}
              {plan.isFeatured && (
                <div className="absolute -top-3 right-6 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-white flex items-center gap-1.5 shadow-lg animate-pulse">
                  <Star size={14} fill="white" />⭐ FEATURED
                </div>
              )}

              {/* Status Badges */}
              <div className="absolute top-6 left-6 flex gap-2">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    plan.isActive
                      ? "bg-green-500/20 text-green-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {plan.isActive ? "Active" : "Inactive"}
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/5 text-white/60">
                  {plan.tier}
                </div>
              </div>

              {/* Header */}
              <div className="mb-8 mt-8">
                <h3 className="text-xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-orange-500">
                    {plan.currency === "BDT" ? "৳" : "$"}
                    {plan.price?.monthly || 0}
                  </span>
                  <span className="text-white/40 text-sm">/mo</span>
                </div>
                <div className="text-white/40 text-sm mt-1">
                  {plan.currency === "BDT" ? "৳" : "$"}
                  {plan.price?.yearly || 0} /year
                </div>
              </div>

              {/* Benefits */}
              <ul className="space-y-4 mb-8 min-h-[200px]">
                {(plan.benefits || []).map((benefit, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-white/80"
                  >
                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="leading-tight">{benefit}</span>
                  </li>
                ))}
                {(!plan.benefits || plan.benefits.length === 0) && (
                  <li className="text-white/40 italic">No benefits listed</li>
                )}
              </ul>

              {/* Actions */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleToggleActive(plan._id, plan.isActive)}
                    className={`flex items-center justify-center gap-2 font-medium py-2 rounded-lg transition-all border text-sm ${
                      plan.isActive
                        ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
                        : "bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                    }`}
                  >
                    {plan.isActive ? (
                      <ToggleRight size={16} />
                    ) : (
                      <ToggleLeft size={16} />
                    )}
                    {plan.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() =>
                      handleToggleFeatured(plan._id, plan.isFeatured)
                    }
                    className={`flex items-center justify-center gap-2 font-medium py-2 rounded-lg transition-all border text-sm ${
                      plan.isFeatured
                        ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/30"
                        : "bg-white/5 hover:bg-white/10 text-white/60 border-white/10"
                    }`}
                  >
                    <Star
                      size={16}
                      fill={plan.isFeatured ? "currentColor" : "none"}
                    />
                    {plan.isFeatured ? "Featured" : "Feature"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium py-2 rounded-lg transition-all border border-blue-500/30"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan._id, plan.name)}
                    className="flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium py-2 rounded-lg transition-all border border-red-500/30"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditPlanModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        plan={selectedPlan}
        onSave={handleSaveEdit}
      />

      <CreatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        planType={activeTab}
        onSave={handleSaveCreate}
      />
    </div>
  );
}
