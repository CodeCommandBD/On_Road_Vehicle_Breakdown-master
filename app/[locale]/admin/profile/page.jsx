"use client";

import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import ProfileForm from "@/components/dashboard/ProfileForm";
import { User, Shield } from "lucide-react";

export default function AdminProfilePage() {
  const user = useSelector(selectUser);

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
      <ProfileForm user={user} />
    </div>
  );
}
