"use client";

import PlanList from "@/components/admin/plans/PlanList";

export default function PlansPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Membership Plans</h1>
          <p className="text-white/60 mt-1">
            Manage pricing and benefits for your plans.
          </p>
        </div>
      </div>

      <PlanList />
    </div>
  );
}
