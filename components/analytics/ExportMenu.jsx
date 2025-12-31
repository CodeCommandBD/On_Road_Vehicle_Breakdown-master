import { useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "react-toastify";
import { downloadCSV, downloadPDF } from "@/lib/utils/reportGenerator";

export default function ExportMenu({ data, activeTab, dateRange }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format) => {
    try {
      if (format === "csv") {
        exportCSV();
      } else {
        exportPDF();
      }
      toast.success(`${format.toUpperCase()} report generated!`);
      setIsOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to generate report");
    }
  };

  const exportCSV = () => {
    let exportData = [];
    let filename = `analytics_${activeTab}_${dateRange}days`;

    if (activeTab === "overview" || activeTab === "revenue") {
      // Flatten revenue metrics
      const mrr = data.revenue?.mrr?.total || 0;
      const arr = data.revenue?.arr?.total || 0;
      exportData = [
        {
          Metric: "MRR",
          Value: mrr,
        },
        {
          Metric: "ARR",
          Value: arr,
        },
        {
          Metric: "Active Customers",
          Value: data.revenue?.customers?.active || 0,
        },
      ];
    } else if (activeTab === "garages") {
      exportData =
        data.garages?.topPerformers?.map((g) => ({
          Name: g.garage?.name,
          City: g.garage?.address?.city,
          Score: g.performanceScore?.overall,
          Revenue: g.revenue?.total,
          Bookings: g.bookings?.total,
        })) || [];
    }

    downloadCSV(exportData, filename);
  };

  const exportPDF = () => {
    let sections = [];
    let title = "Analytics Report";

    if (activeTab === "overview" || activeTab === "revenue") {
      title = "Revenue & Growth Report";
      const rev = data.revenue || {};
      sections.push({
        title: "Key Financial Metrics",
        metrics: {
          "Monthly Recurring Revenue": `BDT ${
            rev.mrr?.total?.toLocaleString() || 0
          }`,
          "Annual Recurring Revenue": `BDT ${
            rev.arr?.total?.toLocaleString() || 0
          }`,
          "Active Customers": rev.customers?.active || 0,
          "Churn Rate": `${rev.churn?.rate || 0}%`,
        },
      });

      if (data.revenueData?.historical) {
        sections.push({
          title: "Revenue History",
          table: {
            headers: ["Date", "MRR", "Growth"],
            rows: data.revenueData.historical.map((h) => [
              new Date(h.date).toLocaleDateString(),
              `BDT ${h.mrr}`,
              `${h.growth}%`,
            ]),
          },
        });
      }
    } else if (activeTab === "garages") {
      title = "Garage Performance Report";
      const garages = data.garages?.topPerformers || [];
      sections.push({
        title: "Top Performing Partners",
        table: {
          headers: ["Name", "City", "Score", "Revenue", "Bookings"],
          rows: garages.map((g) => [
            g.garage?.name || "Unknown",
            g.garage?.address?.city || "N/A",
            g.performanceScore?.overall || 0,
            `BDT ${g.revenue?.total?.toLocaleString() || 0}`,
            g.bookings?.total || 0,
          ]),
        },
      });
    }

    downloadPDF(title, sections, `report_${activeTab}_${dateRange}d`);
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
          type="button"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => handleExport("pdf")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              role="menuitem"
            >
              <FileText className="w-4 h-4 text-red-500" />
              Download PDF
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              role="menuitem"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-500" />
              Download CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
