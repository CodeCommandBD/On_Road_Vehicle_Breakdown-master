"use client";
import { useState } from "react";

import UserTable from "@/components/admin/users/UserTable";
import { Download, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "react-toastify";

export default function UsersPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await axiosInstance.get("/admin/users");
      const data = res.data;

      if (data.success) {
        const users = data.users;
        // ... rest of the logic

        // Convert to CSV
        const headers = ["Name", "Email", "Role", "Points", "Status", "Joined"];
        const rows = users.map((user) => [
          user.name,
          user.email,
          user.role,
          user.rewardPoints || 0,
          user.isActive === false ? "Banned" : "Active",
          new Date(user.createdAt).toLocaleDateString(),
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        // Download file
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users-export-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            User Management
          </h1>
          <p className="text-white/60">
            Manage all registered users, roles, and permissions.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="bg-[#FF532D] hover:bg-[#F23C13] text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download size={16} />
              Export Users
            </>
          )}
        </button>
      </div>

      <UserTable />
    </div>
  );
}
