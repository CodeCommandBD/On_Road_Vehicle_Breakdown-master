"use client";

import { useState } from "react";
import GarageTable from "@/components/admin/garages/GarageTable";
import { Download } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export default function GaragesPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get("/api/admin/garages");
      if (response.data.success) {
        const garages = response.data.garages;

        // Create CSV content
        const headers = [
          "Name",
          "Owner",
          "Status",
          "Plan",
          "Points",
          "Location",
          "Joined Date",
        ];
        const rows = garages.map((g) => [
          g.name,
          `"${g.ownerName}"`,
          g.status,
          g.membershipTier || "Free",
          g.ownerPoints,
          `"${g.address?.street}, ${g.address?.city}"`,
          new Date(g.createdAt).toLocaleDateString(),
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
          `garage-list-${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Garage list exported successfully");
      }
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Failed to export garages");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Garage Management
          </h1>
          <p className="text-white/60">
            Verify new garage requests and manage existing partners.
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
          <span>{isExporting ? "Exporting..." : "Export Garages"}</span>
        </button>
      </div>

      <GarageTable />
    </div>
  );
}
