"use client";

import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import GarageDashboard from "@/components/dashboard/GarageDashboard";
import UserDashboard from "@/components/dashboard/UserDashboard";
import { Wrench } from "lucide-react";

export default function DashboardPage() {
  const user = useSelector(selectUser);

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Wrench className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {user.role === "garage" ? (
        <GarageDashboard user={user} />
      ) : (
        <UserDashboard user={user} />
      )}
    </>
  );
}
