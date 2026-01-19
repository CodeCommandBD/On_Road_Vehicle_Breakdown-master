"use client";

import { useState, useEffect } from "react";
import BookingTable from "@/components/admin/bookings/BookingTable";
import { Download } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "react-toastify";

export default function BookingsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axiosInstance.get("/admin/bookings");
      if (response.data.success) {
        const bookings = response.data.bookings;

        // Create CSV content
        const headers = [
          "Booking ID",
          "Customer",
          "Garage",
          "Service",
          "Status",
          "Vehicle",
          "Amount",
          "Date",
        ];
        const rows = bookings.map((b) => [
          b.bookingNumber,
          `"${b.user?.name || "Unknown"}"`,
          `"${b.garage?.name || "N/A"}"`,
          `"${b.service?.name || "N/A"}"`,
          b.status,
          b.vehicleType,
          b.actualCost || b.estimatedCost || 0,
          new Date(b.createdAt).toLocaleDateString(),
        ]);

        const csvContent = [headers, ...rows]
          .map((e) => e.join(","))
          .join("\n");
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `bookings-export-${new Date().toISOString().split("T")[0]}.csv`,
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Bookings exported successfully");
      }
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Failed to export bookings");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Booking Management
          </h1>
          <p className="text-white/60">
            Track and monitor all service requests across the platform.
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl border border-white/10 transition-all disabled:opacity-50"
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download size={18} />
          )}
          <span>{isExporting ? "Exporting..." : "Export Bookings"}</span>
        </button>
      </div>

      <BookingTable />
    </div>
  );
}
