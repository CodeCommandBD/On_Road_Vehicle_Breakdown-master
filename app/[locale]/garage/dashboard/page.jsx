"use client";

import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import UserDashboard from "@/components/dashboard/UserDashboard";
import GarageDashboard from "@/components/garage/GarageDashboard";

export const metadata = {
  title: "Garage Dashboard",
  description: "Manage your garage services, bookings, and customer requests.",
  robots: "noindex, nofollow", // Private page
};
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const user = useSelector(selectUser);

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
