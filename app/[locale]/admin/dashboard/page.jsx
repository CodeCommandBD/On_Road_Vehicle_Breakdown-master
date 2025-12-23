"use client";

import DashboardStats from "@/components/admin/dashboard/DashboardStats";
import SubscriptionStats from "@/components/admin/dashboard/SubscriptionStats";
import RevenueChart from "@/components/admin/dashboard/RevenueChart";
import EmergencySOS from "@/components/admin/dashboard/EmergencySOS";
import RecentBookings from "@/components/admin/dashboard/RecentBookings";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Dashboard Overview
        </h1>
        <p className="text-white/60">
          Welcome back, Admin. Here is what&apos;s happening today.
        </p>
      </div>

      {/* Stats Cards */}
      <DashboardStats />

      {/* Subscription Analytics */}
      <SubscriptionStats />

      {/* Emergency SOS - High Priority */}
      <EmergencySOS />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section - Takes 2 cols */}
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>

        {/* Recent Activity - Takes 1 col */}
        <div className="lg:col-span-1">
          <RecentBookings />
        </div>
      </div>
    </div>
  );
}
