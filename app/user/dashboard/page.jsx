"use client";

import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import UserDashboard from "@/components/dashboard/UserDashboard";
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
