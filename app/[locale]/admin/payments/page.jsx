"use client";

import PaymentStats from "@/components/admin/payments/PaymentStats";
import PaymentTable from "@/components/admin/payments/PaymentTable";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Financial Overview</h1>
        <p className="text-white/60">Monitor revenue streams, payouts, and transaction history.</p>
      </div>

      <PaymentStats />
      <PaymentTable />
    </div>
  );
}
