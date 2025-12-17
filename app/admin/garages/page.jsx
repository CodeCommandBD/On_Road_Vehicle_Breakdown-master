"use client";

import GarageTable from "@/components/admin/garages/GarageTable";

export default function GaragesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Garage Management</h1>
          <p className="text-white/60">Verify new garage requests and manage existing partners.</p>
        </div>
      </div>

      <GarageTable />
    </div>
  );
}
