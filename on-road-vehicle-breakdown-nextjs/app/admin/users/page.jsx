"use client";

import UserTable from "@/components/admin/users/UserTable";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">User Management</h1>
          <p className="text-white/60">Manage all registered users, roles, and permissions.</p>
        </div>
        <button className="bg-[#FF532D] hover:bg-[#F23C13] text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-sm">
          Export Users
        </button>
      </div>

      <UserTable />
    </div>
  );
}
