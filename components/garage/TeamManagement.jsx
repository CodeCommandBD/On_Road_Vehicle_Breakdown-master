"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { Users, Plus, Edit2, Trash2, Loader2, Lock, Crown } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function TeamManagement() {
  const queryClient = useQueryClient();
  const t = useTranslations("Subscription");
  const user = useSelector(selectUser);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "mechanic",
  });

  const isPremium =
    user?.garage?.membershipTier === "premium" ||
    user?.garage?.membershipTier === "enterprise";

  const memberLimits = {
    free: 1,
    trial: 1,
    basic: 3,
    standard: 5,
    premium: 10,
    enterprise: -1,
  };

  const currentLimit = memberLimits[user?.garage?.membershipTier || "free"];

  const { data: members = [], isLoading: loading } = useQuery({
    queryKey: ["garageTeam", user?.garage?._id],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/api/garage/team?garageId=${user.garage._id}`,
      );
      return response.data.data.teamMembers || [];
    },
    enabled: !!(isPremium && user?.garage?._id),
    staleTime: 5 * 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: async (newMember) => {
      const response = await axiosInstance.post("/garage/team", {
        garageId: user.garage._id,
        ...newMember,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Team member added!");
      setShowAddModal(false);
      setFormData({ name: "", email: "", phone: "", role: "mechanic" });
      queryClient.invalidateQueries({ queryKey: ["garageTeam"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add member");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (memberId) => {
      const response = await axiosInstance.delete(
        `/api/garage/team?garageId=${user.garage._id}&memberId=${memberId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ["garageTeam"] });
    },
    onError: () => {
      toast.error("Failed to remove member");
    },
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  const handleDelete = async (memberId) => {
    if (!confirm("Remove this team member?")) return;
    deleteMutation.mutate(memberId);
  };

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
        <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mb-6">
          <Lock className="text-orange-500" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {t("lockedTitle")}
        </h2>
        <p className="text-white/60 text-center mb-6 max-w-md">
          {t("lockedDesc")}
        </p>
        <Link
          href="/garage/dashboard/subscription"
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-colors"
        >
          {t("upgradePremium")}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-orange-500" />
            Team Management
          </h1>
          <p className="text-white/60 text-sm">
            {members.length} /{" "}
            {currentLimit === -1 ? "Unlimited" : currentLimit} members
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          disabled={currentLimit !== -1 && members.length >= currentLimit}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={20} />
          Add Member
        </button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div
            key={member._id}
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Users className="text-orange-500" size={24} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(member._id)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            </div>

            <h3 className="text-white font-bold text-lg mb-1">{member.name}</h3>
            <p className="text-white/60 text-sm mb-2">{member.email}</p>
            {member.phone && (
              <p className="text-white/60 text-sm mb-3">{member.phone}</p>
            )}

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  member.role === "owner"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : member.role === "manager"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-green-500/20 text-green-400"
                }`}
              >
                {member.role === "owner" && (
                  <Crown size={12} className="inline mr-1" />
                )}
                {member.role.toUpperCase()}
              </span>
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <div className="col-span-full text-center py-16">
            <Users className="mx-auto text-white/20 mb-4" size={48} />
            <p className="text-white/40">
              No team members yet. Add your first member!
            </p>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">
              Add Team Member
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                >
                  <option value="mechanic" className="bg-[#1A1A1A] text-white">
                    Mechanic
                  </option>
                  <option value="manager" className="bg-[#1A1A1A] text-white">
                    Manager
                  </option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-colors"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
