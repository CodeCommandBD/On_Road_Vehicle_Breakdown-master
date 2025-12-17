"use client";

import ReviewTable from "@/components/admin/reviews/ReviewTable";

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
         <h1 className="text-2xl font-bold text-white mb-2">Review Management</h1>
         <p className="text-white/60">Moderate user reviews and maintain platform quality.</p>
      </div>

      <ReviewTable />
    </div>
  );
}
