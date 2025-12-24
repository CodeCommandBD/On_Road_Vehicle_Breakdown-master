"use client";

import { useState, useEffect, useCallback } from "react";
import PaymentStats from "@/components/admin/payments/PaymentStats";
import PaymentTable from "@/components/admin/payments/PaymentTable";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    payments: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    stats: { revenue: 0, payouts: 0, net: 0, count: 0 },
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "all",
    type: "all",
    startDate: "",
    endDate: "",
  });

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.type !== "all" && { type: filters.type }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const res = await fetch(`/api/admin/payments?${queryParams}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.message || "Failed to fetch payments");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 })); // Reset to page 1 on filter change
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Financial Overview
        </h1>
        <p className="text-white/60">
          Monitor revenue streams, payouts, and transaction history.
        </p>
      </div>

      {loading && !data.payments.length ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-white/50" size={40} />
        </div>
      ) : (
        <>
          <PaymentStats stats={data.stats} />
          <PaymentTable
            payments={data.payments}
            pagination={data.pagination}
            filters={filters}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}
