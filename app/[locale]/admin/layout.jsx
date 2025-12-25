"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

// Prevent hydration mismatch by using client component for state
export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
