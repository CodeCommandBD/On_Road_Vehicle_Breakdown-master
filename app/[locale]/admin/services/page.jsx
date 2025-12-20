"use client";

import ServiceList from "@/components/admin/services/ServiceList";

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div>
         <h1 className="text-2xl font-bold text-white mb-2">Service Management</h1>
         <p className="text-white/60">Manage service categories offered on the platform.</p>
      </div>

      <ServiceList />
    </div>
  );
}
