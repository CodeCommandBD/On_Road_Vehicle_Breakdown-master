"use client";

import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import UserDashboard from "@/components/dashboard/UserDashboard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function UserDashboardPage() {
  const user = useSelector(selectUser);

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  return <UserDashboard user={user} />;
}
