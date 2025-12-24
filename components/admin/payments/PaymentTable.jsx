"use client";

import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import PaymentDetailsModal from "./PaymentDetailsModal";

export default function PaymentTable({
  payments = [],
  pagination,
  filters,
  onFilterChange,
  onPageChange,
  loading,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "bg-green-500/10 text-green-500";
      case "pending":
        return "bg-orange-500/10 text-orange-500";
      case "refunded":
        return "bg-red-500/10 text-red-500";
      case "failed":
        return "bg-red-500/10 text-red-500";
      case "cancelled":
        return "bg-gray-500/10 text-gray-400";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      onFilterChange("search", e.target.value);
    }
  };

  const handleExport = () => {
    if (!payments.length) return;

    const headers = [
      "Transaction ID",
      "User",
      "Email",
      "Type",
      "Amount",
      "Status",
      "Date",
    ];
    const csvData = payments.map((p) => [
      p.sslcommerz?.transactionId || p.invoice?.invoiceNumber || p._id,
      p.user?.name || "N/A",
      p.user?.email || "N/A",
      p.type,
      p.amount,
      p.status,
      p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((item) => `"${item}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `payments_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="bg-[#1E1E1E] rounded-xl border border-white/5 overflow-hidden">
        {/* Header & Tools */}
        <div className="p-6 border-b border-white/10 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-bold text-white">
              Recent Transactions
            </h3>
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search ID..."
                  defaultValue={filters.search}
                  onKeyDown={handleSearch}
                  className="w-full sm:w-64 bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#FF532D]"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  showFilters
                    ? "bg-[#FF532D] text-white"
                    : "bg-white/5 hover:bg-white/10 text-white"
                }`}
              >
                <Filter size={16} /> Filters
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors"
              >
                <Download size={16} /> Export
              </button>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
              <select
                value={filters.status}
                onChange={(e) => onFilterChange("status", e.target.value)}
                className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#FF532D]"
              >
                <option value="all" className="bg-[#1A1A1A] text-white">
                  All Status
                </option>
                <option value="success" className="bg-[#1A1A1A] text-white">
                  Success
                </option>
                <option value="pending" className="bg-[#1A1A1A] text-white">
                  Pending
                </option>
                <option value="failed" className="bg-[#1A1A1A] text-white">
                  Failed
                </option>
                <option value="refunded" className="bg-[#1A1A1A] text-white">
                  Refunded
                </option>
              </select>

              <select
                value={filters.type}
                onChange={(e) => onFilterChange("type", e.target.value)}
                className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#FF532D]"
              >
                <option value="all" className="bg-[#1A1A1A] text-white">
                  All Types
                </option>
                <option
                  value="subscription"
                  className="bg-[#1A1A1A] text-white"
                >
                  Subscription
                </option>
                <option value="service_fee">Service Fee</option>
                <option value="payout">Payout</option>
              </select>

              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => onFilterChange("startDate", e.target.value)}
                className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#FF532D]"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => onFilterChange("endDate", e.target.value)}
                className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#FF532D]"
              />
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-white/60 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-white/5 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-white/5 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-white/5 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-white/5 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-white/5 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-white/5 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-white/5 rounded w-8 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-white/40"
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                payments.map((tx) => (
                  <tr
                    key={tx._id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono text-white/80 text-sm">
                      {tx.sslcommerz?.transactionId ||
                        tx.invoice?.invoiceNumber ||
                        tx._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">
                        {tx.user?.name || "Unknown User"}
                      </div>
                      <div className="text-white/40 text-xs">
                        {tx.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/70 capitalize">
                      {tx.type?.replace("_", " ")}
                    </td>
                    <td
                      className={`px-6 py-4 font-bold ${
                        tx.type === "payout" ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      {tx.type === "payout" ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          tx.status
                        )}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/40 text-sm">
                      {tx.createdAt
                        ? format(new Date(tx.createdAt), "dd MMM, hh:mm a")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedPayment(tx)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination?.total > 0 && (
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-white/40">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} entries
            </div>
            <div className="flex gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center px-4 bg-white/5 rounded-lg text-sm text-white font-medium">
                Page {pagination.page} of {pagination.pages}
              </div>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <PaymentDetailsModal
        payment={selectedPayment}
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </>
  );
}
