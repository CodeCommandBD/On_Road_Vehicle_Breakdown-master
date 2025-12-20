"use client";

import SupportTickets from "@/components/admin/support/SupportTickets";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
         <h1 className="text-2xl font-bold text-white mb-2">Support & Disputes</h1>
         <p className="text-white/60">Resolve user complaints and handle emergency situations.</p>
      </div>

      <SupportTickets />
    </div>
  );
}
