"use client";

import { useState, useEffect, useCallback } from "react";
import PaymentStats from "@/components/admin/payments/PaymentStats";
import PaymentTable from "@/components/admin/payments/PaymentTable";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export default function PaymentsPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "all",
    type: "all",
    startDate: "",
    endDate: "",
  });

  const { data, isLoading: loading } = useQuery({
    queryKey: ["adminPayments", filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.type !== "all" && { type: filters.type }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const res = await axiosInstance.get(`/api/admin/payments?${queryParams}`);
      return res.data.data;
    },
    initialData: {
      payments: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      stats: { revenue: 0, payouts: 0, net: 0, count: 0 },
    },
  });

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
