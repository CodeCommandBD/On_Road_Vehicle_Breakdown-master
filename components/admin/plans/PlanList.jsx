"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { DollarSign, Check, Edit2 } from "lucide-react";
import EditPlanModal from "./EditPlanModal";
import { toast } from "react-toastify";

export default function PlanList() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("user");

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/packages?isActive=true&sort=order&type=${activeTab}`
      );
      if (response.data.success) {
        setPlans(response.data.data.packages);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [activeTab]);

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleSave = async (updatedData) => {
    try {
      const response = await axios.put("/api/packages", updatedData);
      if (response.data.success) {
        toast.success("Plan updated successfully");
        fetchPlans(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to update plan:", error);
      toast.error(error.response?.data?.message || "Failed to update plan");
      throw error; // Re-throw to handle in modal
    }
  };

  return (
    <div className="p-6">
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
              className="h-80 bg-white/5 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="group relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/10"
            >
              {/* Tier Badge */}
              <div className="absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/5 text-white/60 group-hover:bg-orange-500/20 group-hover:text-orange-500 transition-colors">
                {plan.tier}
              </div>

              {/* Header */}
              <div className="mb-8">
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
              <button
                onClick={() => handleEdit(plan)}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-all border border-white/5 hover:border-white/20"
              >
                <Edit2 size={18} />
                Edit Plan
              </button>
            </div>
          ))}
        </div>
      )}

      <EditPlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plan={selectedPlan}
        onSave={handleSave}
      />
    </div>
  );
}
