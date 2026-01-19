"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, updateUser } from "@/store/slices/authSlice";
import { User, Shield, Phone, Mail, Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useQuery, useMutation } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export default function AdminProfilePage() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const { isLoading: loading } = useQuery({
    queryKey: ["adminProfile"],
    queryFn: async () => {
      const res = await axiosInstance.get("/profile");
      const data = res.data;
      if (data.success) {
        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
        });
      }
      return data.user;
    },
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData) => {
      const res = await axiosInstance.put("/api/profile", updatedData);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Profile updated successfully");
      dispatch(updateUser(data.user));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const saving = updateMutation.isPending;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF532D]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#FF532D]/10 rounded-lg">
            <User className="w-6 h-6 text-[#FF532D]" />
          </div>
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        </div>
        <p className="text-white/60">
          Manage your admin account information and preferences
        </p>
      </div>

      {/* Admin Badge */}
      <div className="mb-6 p-4 bg-gradient-to-r from-[#FF532D]/10 to-purple-500/10 border border-[#FF532D]/20 rounded-xl flex items-center gap-3">
        <Shield className="w-5 h-5 text-[#FF532D]" />
        <div>
          <p className="text-sm font-bold text-white">Administrator Account</p>
          <p className="text-xs text-white/60">
            You have full system access and control
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <section className="bg-[#161616] p-6 rounded-2xl shadow-sm border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#FF532D]/10 rounded-lg text-[#FF532D]">
            <User className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">Personal Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-black/40 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#FF532D]/20 transition-all outline-none"
                placeholder="Ex: John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-black/40 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#FF532D]/20 transition-all outline-none"
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">
              Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-black/40 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#FF532D]/20 transition-all outline-none"
              placeholder="Ex: 017xxxxxxxx"
              required
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#FF532D] text-white rounded-xl font-bold hover:bg-[#FF532D]/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Profile Changes
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
