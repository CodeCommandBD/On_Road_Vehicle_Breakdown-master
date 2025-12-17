"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectAuthLoading,
  selectUser,
} from "@/store/slices/authSlice";
import Sidebar from "@/components/layout/Sidebar";
import { Loader2 } from "lucide-react";

export default function UserDashboardLayout({ children }) {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!isLoading && user && user.role !== "user") {
      // Redirect non-user roles to appropriate dashboards
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "garage") {
        router.push("/dashboard"); // Garage uses the original dashboard
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
    <div className="flex bg-[#111] min-h-[calc(100vh-80px)]">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-[calc(100vh-80px)]">
        {children}
      </main>
    </div>
  );
}
