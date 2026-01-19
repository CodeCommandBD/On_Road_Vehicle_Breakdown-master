"use client";

import { useState, useEffect } from "react";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import { useSelector, useDispatch } from "react-redux";
import {
  selectIsAuthenticated,
  selectAuthLoading,
  selectUser,
  updateUser,
} from "@/store/slices/authSlice";
import Sidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axios";

// Prevent hydration mismatch by using client component for state
export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouterWithLoading(); // Regular routing
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const user = useSelector(selectUser);

  // Sync profile data on mount
  useEffect(() => {
    const syncProfile = async () => {
      try {
        const res = await axiosInstance.get("/profile");
        if (res.data.success) {
          dispatch(updateUser(res.data.user));
        }
      } catch (error) {
        console.error("Admin layout - Profile sync failed:", error);
      }
    };

    if (isAuthenticated) {
      syncProfile();
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!isLoading && user && user.role !== "admin") {
      // Redirect based on role
      if (
        user.role === "garage" ||
        user.membershipTier === "garage_pro" ||
        user.membershipTier === "garage_basic"
      ) {
        router.push("/garage/dashboard");
      } else if (user.role === "mechanic") {
        router.push("/mechanic/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || (user && user.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex selection:bg-[#FF532D]/30">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
