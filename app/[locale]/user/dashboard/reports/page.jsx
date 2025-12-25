"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, updateUser } from "@/store/slices/authSlice";
import { useTranslations } from "next-intl";
import {
  FileText,
  Settings,
  Download,
  Lock,
  Palette,
  Image as ImageIcon,
  Building,
  Loader2,
  Save,
  Activity,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function ReportsPage() {
  const t = useTranslations("Common"); // Assuming basic translations exist
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("generate");
  const [isLoading, setIsLoading] = useState(false);
  const [brandingForm, setBrandingForm] = useState({
    companyName: "",
    logoUrl: "",
    primaryColor: "#EF4444",
    removeWatermark: false,
  });
  const [reportData, setReportData] = useState(null);
  const [filterDays, setFilterDays] = useState(30);
  const [fetchingReports, setFetchingReports] = useState(true);

  const isEnterprise =
    user?.membershipTier === "enterprise" || user?.planTier === "enterprise";

  useEffect(() => {
    if (user?.branding) {
      setBrandingForm({
        companyName: user.branding.companyName || "",
        logoUrl: user.branding.logoUrl || "",
        primaryColor: user.branding.primaryColor || "#EF4444",
        removeWatermark: user.branding.removeWatermark || false,
      });
    }
  }, [user]);

  useEffect(() => {
    fetchReportData();
  }, [filterDays]);

  const fetchReportData = async () => {
    setFetchingReports(true);
    try {
      const res = await axios.get(`/api/user/reports?days=${filterDays}`);
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch reports", err);
      toast.error("Failed to load report data.");
    } finally {
      setFetchingReports(false);
    }
  };

  const handleBrandingSave = async (e) => {
    e.preventDefault();
    if (!isEnterprise) return;
    setIsLoading(true);
    try {
      const response = await axios.put("/api/profile", {
        branding: brandingForm,
      }); // Re-using profile update endpoint or creating specific one?
      // Assuming profile endpoint accepts partial updates

      if (response.data.success) {
        dispatch(updateUser(response.data.user));
        toast.success("Branding updated successfully!");
      }
    } catch (error) {
      console.error("Branding update error:", error);
      toast.error("Failed to update branding settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // --- BRANDING ---
    const brandName =
      isEnterprise && brandingForm.companyName
        ? brandingForm.companyName
        : "On-Road Help";
    const brandColor =
      isEnterprise && brandingForm.primaryColor
        ? brandingForm.primaryColor
        : "#EF4444";
    // Logo handling is tricky with URLs (CORS), simplified for text/color for now

    // Header
    doc.setFillColor(brandColor);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(brandName, 20, 25);

    doc.setFontSize(12);
    doc.text("Monthly Usage Report", 20, 35);

    // Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated for: ${user.name}`, 20, 50);
    doc.text(`Date: ${format(new Date(), "PPpp")}`, 20, 55);
    doc.text(`Plan: ${user.membershipTier?.toUpperCase()}`, 20, 60);

    // Real Data Table
    const data = reportData
      ? [
          [
            "Total SOS Alerts",
            reportData.summary.totalSOS.toString(),
            reportData.summary.totalSOS > 0 ? "Active" : "None",
          ],
          [
            "Total Bookings",
            reportData.summary.totalBookings.toString(),
            "Processed",
          ],
          [
            "Total Revenue",
            `৳${reportData.summary.totalRevenue.toLocaleString()}`,
            "Paid",
          ],
          ["Status", user.membershipTier?.toUpperCase(), "Verified"],
        ]
      : [
          ["Service Requests", "0", "N/A"],
          ["Total Cost", "৳0", "N/A"],
          ["AI Diagnostics", "0", "N/A"],
          ["SLA Compliance", "N/A", "N/A"],
        ];

    autoTable(doc, {
      startY: 70,
      head: [["Metric", "Value", "Status"]],
      body: data,
      theme: "striped",
      headStyles: { fillColor: brandColor },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("Page " + i + " of " + pageCount, 105, 287, { align: "center" });

      // Watermark logic
      if (!(isEnterprise && brandingForm.removeWatermark)) {
        doc.text(`Powered by ${brandName}`, 105, 292, { align: "center" });
      }
    }

    doc.save(`${brandName.replace(/\s+/g, "_")}_Report.pdf`);
    toast.success("Report downloaded!");
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metric,Value\n";
    csvContent += `Total SOS Alerts,${reportData.summary.totalSOS}\n`;
    csvContent += `Total Bookings,${reportData.summary.totalBookings}\n`;
    csvContent += `Total Revenue,${reportData.summary.totalRevenue}\n`;
    csvContent += "\nSOS Trend\nDate,Count\n";
    reportData.sosTrend.forEach((row) => {
      csvContent += `${row._id},${row.count}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "usage_report.csv");
    document.body.appendChild(link);
    link.click();
    toast.success("CSV Exported!");
  };

  const COLORS = [
    "#EF4444",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-500" />
          White-label Reports
        </h1>
        <p className="text-white/60 mt-1">
          Generate professional reports with your own company branding.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveTab("generate")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "generate"
              ? "text-blue-400"
              : "text-white/60 hover:text-white"
          }`}
        >
          Generate Reports
          {activeTab === "generate" && (
            <span className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-blue-400 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "settings"
              ? "text-blue-400"
              : "text-white/60 hover:text-white"
          }`}
        >
          Branding Settings
          {activeTab === "settings" && (
            <span className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-blue-400 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl w-fit border border-white/5">
        {[7, 30, 90, 365].map((d) => (
          <button
            key={d}
            onClick={() => setFilterDays(d)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterDays === d
                ? "bg-blue-600 text-white shadow-lg"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {d === 365 ? "1 Year" : `${d} Days`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* GENERATE TAB */}
          {activeTab === "generate" && (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#1E1E1E] border border-white/10 p-5 rounded-2xl">
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Total SOS
                  </p>
                  <p className="text-2xl font-bold text-red-500">
                    {reportData?.summary.totalSOS || 0}
                  </p>
                </div>
                <div className="bg-[#1E1E1E] border border-white/10 p-5 rounded-2xl">
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Bookings
                  </p>
                  <p className="text-2xl font-bold text-blue-500">
                    {reportData?.summary.totalBookings || 0}
                  </p>
                </div>
                <div className="bg-[#1E1E1E] border border-white/10 p-5 rounded-2xl">
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Revenue
                  </p>
                  <p className="text-2xl font-bold text-green-500">
                    ৳{reportData?.summary.totalRevenue.toLocaleString() || 0}
                  </p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* SOS Trend Chart */}
                <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" /> SOS Trend
                    Analysis
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reportData?.sosTrend || []}>
                        <defs>
                          <linearGradient
                            id="colorSos"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#3B82F6"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#3B82F6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff05"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="_id"
                          stroke="#ffffff30"
                          fontSize={10}
                          tickFormatter={(val) =>
                            format(new Date(val), "MMM dd")
                          }
                        />
                        <YAxis stroke="#ffffff30" fontSize={10} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#1E1E1E",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                          }}
                          itemStyle={{ color: "#fff", fontSize: "12px" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorSos)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Service Popularity */}
                <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-500" /> Service Mix
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData?.servicePopularity || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(reportData?.servicePopularity || []).map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#1E1E1E",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                          }}
                          itemStyle={{ color: "#fff", fontSize: "12px" }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          wrapperStyle={{
                            fontSize: "10px",
                            paddingTop: "10px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={generatePDF}
                    disabled={fetchingReports}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF Report
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={fetchingReports}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/10 disabled:opacity-50"
                  >
                    <FileText className="w-5 h-5" />
                    Export as CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
              {!isEnterprise && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
                  <Lock className="w-12 h-12 text-white/30 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Enterprise Feature
                  </h3>
                  <p className="text-white/60 mb-6 max-w-sm">
                    Custom branding for reports is exclusively available on the
                    Enterprise plan.
                  </p>
                  <Link
                    href="/pricing"
                    className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-xl hover:shadow-glow-orange transition-all"
                  >
                    Upgrade to Enterprise
                  </Link>
                </div>
              )}

              <h3 className="text-lg font-semibold text-white mb-6">
                Custom Branding
              </h3>
              <form onSubmit={handleBrandingSave} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={brandingForm.companyName}
                      onChange={(e) =>
                        setBrandingForm({
                          ...brandingForm,
                          companyName: e.target.value,
                        })
                      }
                      placeholder="e.g. Acme Logistics Ltd."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Primary Color (Hex)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingForm.primaryColor}
                      onChange={(e) =>
                        setBrandingForm({
                          ...brandingForm,
                          primaryColor: e.target.value,
                        })
                      }
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none p-0"
                    />
                    <input
                      type="text"
                      value={brandingForm.primaryColor}
                      onChange={(e) =>
                        setBrandingForm({
                          ...brandingForm,
                          primaryColor: e.target.value,
                        })
                      }
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-blue-500 focus:outline-none transition-colors font-mono uppercase"
                    />
                  </div>
                </div>

                {/* White-label Toggle */}
                {isEnterprise && (
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white">
                        White-labeling
                      </p>
                      <p className="text-xs text-white/40">
                        Remove "Powered by" branding from PDF
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={brandingForm.removeWatermark}
                        onChange={(e) =>
                          setBrandingForm({
                            ...brandingForm,
                            removeWatermark: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/10"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Branding
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Location Hotspots */}
          <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest text-blue-400">
              Hotspot Areas
            </h4>
            <div className="space-y-4">
              {(reportData?.hotspots || []).map((spot, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 text-[10px] font-bold text-white/40 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                      {i + 1}
                    </span>
                    <span className="text-xs text-white/70 truncate max-w-[120px]">
                      {spot._id || "Unknown"}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white/40">
                    {spot.count}
                  </span>
                </div>
              ))}
              {(reportData?.hotspots || []).length === 0 && (
                <p className="text-xs text-white/20 italic">
                  No location data yet.
                </p>
              )}
            </div>
          </div>

          {/* Team Performance - Enterprise Only */}
          {isEnterprise && (
            <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-purple-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
                Best Performers
              </h4>
              <div className="space-y-4">
                {(reportData?.teamPerformance || []).map((member, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-xs text-white/80">
                        {member._id}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white/60">
                      {member.sos} pts
                    </span>
                  </div>
                ))}
                {(reportData?.teamPerformance || []).length === 0 && (
                  <p className="text-xs text-white/20 italic text-center py-2">
                    No team activity.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-white mb-2">Why Reports?</h4>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">
              Use data to identify bottlenecks, optimize resources, and improve
              response times.
            </p>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-400" />
                Trends Analysis
              </li>
              <li className="flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-400" />
                Service Popularity
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
