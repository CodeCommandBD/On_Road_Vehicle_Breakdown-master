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
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function PredictiveMaintenancePage() {
  const t = useTranslations("Dashboard"); // You might want to add specific translations later
  const user = useSelector(selectUser);
  const router = useRouter();

  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

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

      const response = await axios.post("/api/ai/diagnose", {
        userId: user._id,
        symptoms: symptoms,
        vehicleContext: vehicleContext,
      });

      if (response.data.success) {
        setResult(response.data.data);
        toast.success("Analysis Complete");
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to analyze symptoms. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBookNow = () => {
    if (!result) return;
    // Redirect to booking page with pre-filled note
    const note = `AI Diagnosis: ${result.analysis.possibleCause}. User reported: ${symptoms}`;
    router.push(
      `/user/dashboard/bookings/new?note=${encodeURIComponent(note)}`
    );
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

        <div className="relative z-10">
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
            analyzed potential issues, estimate costs, and suggest immediate
            actions.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
        {/* Vehicle Badge */}
        {activeVehicle ? (
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-sm text-blue-200">
            <Car className="w-4 h-4" />
            Analyzing for:{" "}
            <span className="font-bold text-white">
              {activeVehicle.make} {activeVehicle.model} ({activeVehicle.year})
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

        <div className="flex justify-end mt-6">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !symptoms.trim()}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl font-bold text-white shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-1 active:translate-y-0"
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
                  Run AI Diagnosis PO
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-700">
          <div className="p-1 h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500"></div>

          <div className="p-6 md:p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                Analysis Report
              </h2>
              <div
                className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold uppercase text-xs tracking-wider ${getSeverityColor(
                  result.analysis.severity
                )}`}
              >
                <Activity className="w-4 h-4" />
                {result.analysis.severity} Severity
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Possible Cause */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Wrench className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-sm text-white/40 font-bold uppercase tracking-wider mb-2">
                  Possible Cause
                </h3>
                <p className="text-white font-semibold text-lg leading-relaxed">
                  {result.analysis.possibleCause}
                </p>
              </div>

              {/* Estimated Cost */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-sm text-white/40 font-bold uppercase tracking-wider mb-2">
                  Est. Cost
                </h3>
                <p className="text-white font-bold text-2xl">
                  {result.analysis.estimatedCost}
                </p>
              </div>

              {/* Immediate Action */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-sm text-white/40 font-bold uppercase tracking-wider mb-2">
                  Immediate Action
                </h3>
                <p className="text-white font-semibold text-lg leading-relaxed">
                  {result.analysis.immediateAction}
                </p>
              </div>
            </div>

            {/* Preventive Measures */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Preventive Measures
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.analysis.preventiveMeasures?.map((measure, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-blue-500/10 text-blue-200 text-sm rounded-lg border border-blue-500/20"
                  >
                    {measure}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setSymptoms("")}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
              >
                New Diagnosis
              </button>
              <button
                onClick={handleBookNow}
                className="flex-1 px-8 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                <Clock className="w-5 h-5" />
                Book Appointment for this Issue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
