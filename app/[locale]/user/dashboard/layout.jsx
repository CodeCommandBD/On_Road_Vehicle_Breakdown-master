"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  selectIsAuthenticated,
  selectAuthLoading,
  selectUser,
  updateUser,
} from "@/store/slices/authSlice";
import Sidebar from "@/components/layout/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Loader2 } from "lucide-react";
import axios from "axios";

export default function UserDashboardLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const user = useSelector(selectUser);

  // Sync profile data on mount
  useEffect(() => {
    const syncProfile = async () => {
      try {
        const res = await axios.get("/api/user/profile");
        if (res.data.success) {
          dispatch(updateUser(res.data.data));
        }
      } catch (error) {
        console.error("Dashboard layout - Profile sync failed:", error);
      }
    };

    if (isAuthenticated) {
      syncProfile();
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!isLoading && user && user.role !== "user") {
      // Redirect non-user roles to appropriate dashboards
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "garage") {
        router.push("/garage/dashboard"); // Garage uses the new garage dashboard
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#111] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
}
