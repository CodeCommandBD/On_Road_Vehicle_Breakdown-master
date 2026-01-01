"use client";

import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import UserDashboard from "@/components/user/UserDashboard";

export const metadata = {
  title: "My Dashboard",
  description:
    "Manage your vehicle breakdown requests, bookings, and service history.",
  robots: "noindex, nofollow", // Private page
};
import { Loader2 } from "lucide-react";

export default function UserDashboardPage() {
  const user = useSelector(selectUser);

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return <UserDashboard user={user} />;
}
