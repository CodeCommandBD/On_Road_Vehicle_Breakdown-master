"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import {
  BrainCircuit,
  AlertTriangle,
  Wrench,
  DollarSign,
  ArrowRight,
  Loader2,
  CheckCircle,
  Activity,
  Shield,
  Clock,
  Car,
  History,
  Info,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import { Download } from "lucide-react";
import DiagnosisDocument from "@/components/pdf/DiagnosisDocument";

export default function PredictiveMaintenancePage() {
  const t = useTranslations("Dashboard"); // You might want to add specific translations later
  const user = useSelector(selectUser);
  const router = useRouterWithLoading(); // Regular routing

  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [activeView, setActiveView] = useState("diagnose"); // "diagnose", "history"
  const [history, setHistory] = useState([]);
  const [usage, setUsage] = useState({ current: 0, limit: 0 });
  const [orgRole, setOrgRole] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    loadHistory();
    loadOrgRole();
  }, []);

  const loadOrgRole = async () => {
    try {
      const res = await axiosInstance.get("/organizations");
      if (res.data.success && res.data.data.length > 0) {
        // Just take first org role for simplicity in this view
        setOrgRole(res.data.data[0].role);
      }
    } catch (error) {
      console.error("Failed to load org role:", error);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await axiosInstance.get("/ai/diagnose");
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Default to first vehicle if available
  const activeVehicle =
    user?.vehicles && user.vehicles.length > 0 ? user.vehicles[0] : null;

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      toast.warning("Please describe the vehicle issues.");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      // Prepare vehicle context
      const vehicleContext = activeVehicle
        ? {
            model: `${activeVehicle.make} ${activeVehicle.model}`,
            year: activeVehicle.year,
            type: activeVehicle.vehicleType,
          }
        : null;

      const response = await axiosInstance.post("/ai/diagnose", {
        userId: user._id,
        symptoms: symptoms,
        vehicleContext: vehicleContext,
      });

      if (response.data.success) {
        setResult(response.data.data.analysis);
        if (response.data.usage) {
          setUsage(response.data.usage);
        }
        toast.success("Analysis Complete");
        loadHistory();
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to analyze symptoms. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBookNow = () => {
    if (!result) return;
    // Redirect to booking page with pre-filled note
    // Redirect to booking page with pre-filled note
    // We use the main /book page which handles new booking flows
    const note = `AI Diagnosis: ${result.possibleCause}. User reported: ${symptoms}`;
    router.push(`/book?note=${encodeURIComponent(note)}`);
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
      case "critical":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "medium":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "low":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      default:
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    }
  };

  const downloadReport = async () => {
    if (!result) return;
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const diagnosisData = {
        analysis: result,
        vehicleType: activeVehicle
          ? `${activeVehicle.make} ${activeVehicle.model}`
          : "Generic",
        symptoms: symptoms,
        createdAt: new Date(),
      };

      const blob = await pdf(
        <DiagnosisDocument diagnosis={diagnosisData} user={user} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `AI_Diagnosis_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                <BrainCircuit className="w-8 h-8 text-white" />
              </div>
              <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold text-white uppercase tracking-wider">
                BETA - ENHANCED AI
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              AI Mechanic Diagnostic
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl">
              Describe your car's symptoms, and our Gemini-powered AI will
              analyze potential issues, estimate costs, and suggest actions.
            </p>
          </div>

          <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/10 w-fit backdrop-blur-sm">
            <button
              onClick={() => setActiveView("diagnose")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeView === "diagnose"
                  ? "bg-white text-blue-600 shadow-xl"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Wrench className="w-4 h-4" />
              Diagnose
            </button>
            <button
              onClick={() => setActiveView("history")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeView === "history"
                  ? "bg-white text-blue-600 shadow-xl"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>
        </div>
      </div>

      {activeView === "diagnose" ? (
        <>
          {/* Usage Stats (Tier Info) */}
          {usage.limit > 0 && (
            <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Monthly Usage: </span>
                  <span className="text-white font-bold">
                    {usage.limit >= 9999
                      ? "Unlimited"
                      : `${usage.current} / ${usage.limit}`}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded">
                {user?.membershipTier} Plan
              </p>
            </div>
          )}

          {/* Input Section */}
          <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
            {/* Vehicle Badge */}
            {activeVehicle ? (
              <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-sm text-blue-200">
                <Car className="w-4 h-4" />
                Analyzing for:{" "}
                <span className="font-bold text-white">
                  {activeVehicle.make} {activeVehicle.model} (
                  {activeVehicle.year})
                </span>
              </div>
            ) : (
              <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-full border border-yellow-500/20 text-sm text-yellow-500">
                <Car className="w-4 h-4" />
                <span>No specific vehicle selected (Generic Mode)</span>
              </div>
            )}

            <label className="block text-white font-medium mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Describe Symptoms
            </label>
            <div className="relative">
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. Engine light blinking, grinding noise when braking, car vibrates at 80km/h..."
                className="w-full bg-black/30 text-white border border-white/10 rounded-xl p-4 min-h-[120px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none text-lg"
              />
              <div className="absolute bottom-4 right-4 text-xs text-white/30">
                {symptoms.length} chars
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              {orgRole === "viewer" ? (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm w-full">
                  <Shield className="w-4 h-4" />
                  <span>
                    As a <strong>Viewer</strong>, you cannot perform new
                    diagnoses.
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="p-1.5 bg-white/5 rounded-lg">
                      <Info className="w-3 h-3" />
                    </div>
                    Gemini AI provides fast automotive insights
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !symptoms.trim()}
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl font-bold text-white shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto"
                  >
                    <span className="flex items-center gap-2 relative z-10">
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Diagnosing...
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="w-5 h-5" />
                          Run AI Diagnosis
                        </>
                      )}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Result Section */}
          {result && (
            <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-700 mt-8">
              <div className="p-1 h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500"></div>

              <div className="p-6 md:p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    Analysis Report
                  </h2>
                  <div
                    className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold uppercase text-xs tracking-wider ${getSeverityColor(
                      result.severity,
                    )}`}
                  >
                    <Activity className="w-4 h-4" />
                    {result.severity} Severity
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Wrench className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-sm text-white/40 font-bold uppercase tracking-wider mb-2">
                      Cause
                    </h3>
                    <p className="text-white font-semibold text-lg">
                      {result.possibleCause}
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-sm text-white/40 font-bold uppercase tracking-wider mb-2">
                      Est. Cost
                    </h3>
                    <p className="text-white font-bold text-2xl">
                      {result.estimatedCost}
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                      <AlertTriangle className="w-6 h-6 text-orange-400" />
                    </div>
                    <h3 className="text-sm text-white/40 font-bold uppercase tracking-wider mb-2">
                      Action
                    </h3>
                    <p className="text-white font-semibold text-lg">
                      {result.immediateAction}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10">
                  <button
                    onClick={downloadReport}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    Download Report
                  </button>
                  <button
                    onClick={handleBookNow}
                    className="flex-1 px-8 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
                  >
                    <Clock className="w-5 h-5" />
                    Book Appointment
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSymptoms("")}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                  >
                    New Diagnosis
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* History View */
        <div className="space-y-4">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center p-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p>Loading History...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-[#1E1E1E] border border-white/5 rounded-3xl p-16 text-center">
              <History className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                No history yet
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Perform your first AI diagnosis to see your reports here.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item._id}
                className="group bg-[#1E1E1E] border border-white/5 hover:border-blue-500/30 rounded-2xl p-6 transition-all cursor-pointer"
                onClick={() => {
                  setResult(item.analysis);
                  setSymptoms(item.symptoms);
                  setActiveView("diagnose");
                  window.scrollTo({ top: 300, behavior: "smooth" });
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Car className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">
                        {item.analysis.possibleCause}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getSeverityColor(
                      item.analysis.severity,
                    )}`}
                  >
                    {item.analysis.severity}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5 group-hover:border-blue-500/10">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3 text-green-500" />
                      {item.analysis.estimatedCost}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-blue-400 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    View Full Report
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer Info */}
      <p className="text-center text-gray-600 text-[10px] pb-8 uppercase tracking-[0.3em] font-bold">
        Powered by Google Gemini 1.5 AI &bull; Smart Maintenance Protocol
      </p>
    </div>
  );
}
