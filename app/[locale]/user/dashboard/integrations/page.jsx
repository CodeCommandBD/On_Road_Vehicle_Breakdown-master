"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Sidebar from "@/components/layout/Sidebar";
import { Webhook, Save, CheckCircle, AlertCircle, Lock } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function IntegrationsPage() {
  const t = useTranslations("Common");
  const user = useSelector(selectUser);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Access Control: Premium/Enterprise only
  const hasAccess = ["premium", "enterprise"].includes(user?.planTier);

  useEffect(() => {
    if (hasAccess) {
      fetchConfig();
    } else {
      setLoading(false);
    }
  }, [hasAccess]);

  const fetchConfig = async () => {
    try {
      const res = await axios.get("/api/integrations");
      if (res.data.success && res.data.data) {
        setWebhookUrl(res.data.data.webhookUrl || "");
        setIsActive(res.data.data.isActive);
      }
    } catch (err) {
      console.error("Failed to fetch integration config", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await axios.post("/api/integrations", {
        webhookUrl,
        isActive,
      });

      if (res.data.success) {
        setMessage({ type: "success", text: "Webhook settings saved!" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#121212] text-white overflow-hidden font-outfit">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-hide relative">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Webhook className="text-purple-500" />
              CRM Integrations
            </h1>
            <p className="text-white/60 mt-2">
              Connect your external systems via Webhooks to receive real-time
              updates.
            </p>
          </div>

          {!hasAccess ? (
            // --- LOCK SCREEN ---
            <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-8 max-w-2xl w-full text-center shadow-2xl mx-auto mt-10 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full pointer-events-none" />

              <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                <Lock className="w-8 h-8 text-purple-500" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2 relative z-10">
                Premium Integration
              </h2>
              <p className="text-white/60 mb-8 relative z-10">
                Connect Salesforce, HubSpot, Slack, or your custom CRM to get
                real-time SOS alerts and booking updates.
                <br />
                Available exclusively on **Premium** and **Enterprise** plans.
              </p>

              <Link
                href="/pricing"
                className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all relative z-10"
              >
                Upgrade Now
              </Link>
            </div>
          ) : (
            // --- CONFIG FORM ---
            <div className="max-w-3xl">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Webhook Configuration</h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        isActive
                          ? "bg-green-500 shadow-[0_0_10px_#22c55e]"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm text-white/60">
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Payload URL
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://api.your-crm.com/webhooks/sos-alerts"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <p className="text-xs text-white/40 mt-2">
                      We will send a POST request to this URL with JSON data for
                      every new SOS alert.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                    />
                    <label
                      htmlFor="isActive"
                      className="text-white/80 cursor-pointer select-none"
                    >
                      Enable Webhook Integration
                    </label>
                  </div>

                  {message && (
                    <div
                      className={`p-4 rounded-xl flex items-center gap-3 ${
                        message.type === "success"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {message.type === "success" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      {message.text}
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/10 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Configuration
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Documentation Snippet */}
              <div className="mt-8 bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-blue-400 mb-4">
                  Payload Example
                </h3>
                <pre className="bg-black/30 p-4 rounded-lg text-xs text-white/70 overflow-x-auto font-mono">
                  {`{
  "id": "uuid-v4",
  "event": "sos.created",
  "timestamp": "2024-12-21T10:00:00Z",
  "data": {
    "sosId": "60d5ec...",
    "location": { "coordinates": [90.41, 23.81] },
    "status": "pending",
    "vehicleType": "car"
  }
}`}
                </pre>
                <p className="text-xs text-white/40 mt-4">
                  Note: Verify the <code>X-Signature</code> header using your
                  secret key to ensure authenticity.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
