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
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import { format } from "date-fns";

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
  });

  const isEnterprise = user?.membershipTier === "enterprise";

  useEffect(() => {
    if (user?.branding) {
      setBrandingForm({
        companyName: user.branding.companyName || "",
        logoUrl: user.branding.logoUrl || "",
        primaryColor: user.branding.primaryColor || "#EF4444",
      });
    }
  }, [user]);

  const handleBrandingSave = async (e) => {
    e.preventDefault();
    if (!isEnterprise) return;
    setIsLoading(true);
    try {
      const response = await axios.put("/api/user/profile", {
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

    // Mock Data Table
    const data = [
      ["Service Requests", "5", "Completed"],
      ["Total Cost", "৳12,500", "Paid"],
      ["AI Diagnostics", "12", "Used"],
      ["SLA Compliance", "100%", "Excellent"],
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
      doc.text(`Powered by ${brandName}`, 105, 292, { align: "center" });
    }

    doc.save(`${brandName.replace(/\s+/g, "_")}_Report.pdf`);
    toast.success("Report downloaded!");
  };

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

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* GENERATE TAB */}
          {activeTab === "generate" && (
            <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Monthly Activity Report
              </h3>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60 text-sm">Preview</span>
                  {!isEnterprise && (
                    <span className="text-[10px] text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded">
                      STANDARD BRANDING
                    </span>
                  )}
                </div>
                {/* Tiny Preview Mockup */}
                <div className="w-full aspect-[4/1] bg-white rounded flex flex-col overflow-hidden relative">
                  <div
                    style={{
                      backgroundColor: isEnterprise
                        ? brandingForm.primaryColor
                        : "#EF4444",
                    }}
                    className="h-6 w-full px-4 flex items-center"
                  >
                    <span className="text-white font-bold text-xs">
                      {isEnterprise && brandingForm.companyName
                        ? brandingForm.companyName
                        : "On-Road Help"}
                    </span>
                  </div>
                  <div className="flex-1 p-4 grid grid-cols-3 gap-2">
                    <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={generatePDF}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                >
                  <Download className="w-5 h-5" />
                  Download PDF Report
                </button>
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
        <div>
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-white mb-2">
              Why White-label?
            </h4>
            <p className="text-sm text-white/60 mb-4">
              Present reports to your stakeholders with your own corporate
              identity, reinforcing your brand's professionalism.
            </p>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-400" />
                Custom Color Scheme
              </li>
              <li className="flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-400" />
                Your Company Name
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
