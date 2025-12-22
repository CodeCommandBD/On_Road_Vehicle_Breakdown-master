"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import {
  Activity,
  Webhook,
  Save,
  CheckCircle,
  AlertCircle,
  Lock,
  Trash2,
  Key,
  RefreshCw,
  Clock,
  Zap,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  ChevronDown,
  Server,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function AutomationPage() {
  const t = useTranslations("Common");
  const user = useSelector(selectUser);
  const [integration, setIntegration] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState(["sos.created"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [payloadFormat, setPayloadFormat] = useState("slack");
  const [testing, setTesting] = useState(false);

  const hasAccess = ["premium", "enterprise"].includes(user?.membershipTier);
  const availableEvents = [
    { id: "sos.created", label: "New SOS Alert" },
    { id: "sos.updated", label: "SOS Status Updated" },
    { id: "booking.created", label: "New Service Booking" },
    { id: "booking.completed", label: "Booking Completed" },
  ];

  useEffect(() => {
    if (hasAccess) {
      fetchIntegration();
    } else {
      setLoading(false);
    }
  }, [hasAccess]);

  const fetchIntegration = async () => {
    try {
      const res = await axios.get("/api/automation");
      if (res.data.success && res.data.data) {
        setIntegration(res.data.data);
        setWebhookUrl(res.data.data.webhookUrl || "");
        setIsActive(res.data.data.isActive);
        setSelectedEvents(res.data.data.events || ["sos.created"]);
        setPayloadFormat(res.data.data.payloadFormat || "slack");
      }
    } catch (err) {
      console.error("Failed to fetch integration", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await axios.post("/api/automation", {
        webhookUrl,
        events: selectedEvents,
        isActive,
        payloadFormat,
      });

      if (res.data.success) {
        setMessage({ type: "success", text: "Automation settings saved!" });
        setIntegration(res.data.data);
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to save settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleEvent = (eventId) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    setTesting(true);
    setMessage(null);

    try {
      const res = await axios.post("/api/automation/test");
      if (res.data.success) {
        setMessage({ type: "success", text: "Test webhook delivered!" });
        fetchIntegration(); // Refresh to see the new log
      } else {
        setMessage({
          type: "error",
          text: res.data.error || "Webhook delivery failed.",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Connection error during test." });
    } finally {
      setTesting(false);
    }
  };

  const handleCopySecret = () => {
    if (!integration?.secret) return;
    navigator.clipboard.writeText(integration.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRotateSecret = async () => {
    if (
      !window.confirm("Are you sure? Old secret will stop working immediately.")
    )
      return;

    setRotating(true);
    try {
      const res = await axios.patch("/api/automation");
      if (res.data.success) {
        setIntegration(res.data.data);
        setMessage({ type: "success", text: "Secret rotated successfully!" });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to rotate secret.",
      });
    } finally {
      setRotating(false);
    }
  };

  const handleResetConfig = async () => {
    if (
      !window.confirm("Clear all automation settings? This cannot be undone.")
    )
      return;

    try {
      const res = await axios.delete("/api/automation");
      if (res.data.success) {
        setWebhookUrl("");
        setIsActive(false);
        setSelectedEvents(["sos.created"]);
        setIntegration(null);
        setMessage({ type: "success", text: "Configuration reset." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to reset configuration." });
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-white/50 animate-pulse">
        Loading automation settings...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="text-orange-500 fill-orange-500/20" />
            Control Center & Automation
          </h1>
          <p className="text-white/60 mt-2">
            Streamline your operations by connecting external tools and
            automating workflows.
          </p>
        </div>
        {hasAccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-sm font-medium text-orange-400 capitalize">
              {user?.membershipTier} Plan Enabled
            </span>
          </div>
        )}
      </div>

      {!hasAccess ? (
        <div className="bg-[#1E1E1E] border border-white/10 rounded-[2rem] p-12 text-center shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 max-w-lg mx-auto">
            <div className="w-20 h-20 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 rotate-3 transition-transform group-hover:rotate-0">
              <Lock className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Unlock Enterprise Automation
            </h2>
            <p className="text-white/60 mb-10 leading-relaxed text-lg">
              Connect Webhooks, trigger real-time SOS alerts, and integrate with
              Salesforce, HubSpot, or custom APIs. Available exclusively on{" "}
              <span className="text-orange-400 font-bold">Premium</span> and{" "}
              <span className="text-purple-400 font-bold">Enterprise</span>{" "}
              plans.
            </p>
            <Link
              href="/pricing"
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all transform hover:scale-105"
            >
              Upgrade Plan Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Configuration Card */}
            <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Webhook className="w-32 h-32" />
              </div>

              <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                <Webhook className="text-orange-500" /> Webhook Setup
              </h2>

              <form onSubmit={handleSave} className="space-y-8">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-white/50 ml-1">
                    Payload Endpoint URL
                  </label>
                  <div className="relative flex gap-2">
                    <input
                      type="url"
                      required
                      placeholder="https://your-api.com/webhook"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-white/20"
                    />
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={testing || !webhookUrl}
                      className="px-6 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors text-sm font-bold flex items-center gap-2 disabled:opacity-30 whitespace-nowrap"
                    >
                      {testing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      Test
                    </button>
                  </div>
                  <p className="text-xs text-white/30 ml-1 italic">
                    All event data will be sent to this URL as a payload.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-white/50 ml-1">
                    Payload Format
                  </label>
                  <div className="flex gap-4">
                    {["slack", "json"].map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setPayloadFormat(format)}
                        className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${
                          payloadFormat === format
                            ? "bg-purple-500/10 border-purple-500/40 text-purple-400"
                            : "bg-white/5 border-white/10 text-white/40"
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full border-2 ${
                            payloadFormat === format
                              ? "bg-purple-400 border-purple-400"
                              : "border-white/20"
                          }`}
                        />
                        <span className="text-sm font-bold uppercase tracking-wider">
                          {format}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-white/50 ml-1">
                    Event Subscription
                  </label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {availableEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => toggleEvent(event.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          selectedEvents.includes(event.id)
                            ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                            : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {event.label}
                        </span>
                        {selectedEvents.includes(event.id) && (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">Integration Status</h4>
                    <p className="text-xs text-white/40">
                      Enable or disable all triggers instantly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      isActive ? "bg-orange-500" : "bg-white/20"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {message && (
                  <div
                    className={`p-5 rounded-2xl flex items-center gap-3 animate-in slide-in-from-left-2 ${
                      message.type === "success"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {message.type === "success" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium">{message.text}</span>
                  </div>
                )}

                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    className="text-white/40 hover:text-red-400 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" /> Reset Config
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-orange-500/20 disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" /> Save Configuration
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-8">
            {/* Security Card */}
            <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-8">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-purple-400">
                <Key className="w-5 h-5" /> Signature Secret
              </h2>
              <div className="space-y-4">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 font-mono text-xs break-all text-white/60 relative group flex items-center justify-between gap-2 overflow-hidden">
                  <span className="truncate">
                    {integration?.secret
                      ? showSecret
                        ? integration.secret
                        : "••••••••••••••••••••"
                      : "No secret generated"}
                  </span>
                  <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="hover:text-white transition-colors p-1"
                      title={showSecret ? "Hide Secret" : "Show Secret"}
                    >
                      {showSecret ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={handleCopySecret}
                      className="hover:text-orange-400 transition-colors p-1"
                      title="Copy Secret"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">
                  Every request sent will include an <code>X-Signature</code>{" "}
                  header. Use this secret to verify the authenticity of the
                  data.
                </p>
                <button
                  onClick={handleRotateSecret}
                  disabled={rotating}
                  className="w-full py-2.5 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                >
                  {rotating ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Rotate Secret
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-8">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-400">
                <Activity className="w-5 h-5" /> Activity Log
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Total Success</p>
                      <p className="text-[10px] text-white/40">
                        Successful deliveries
                      </p>
                    </div>
                  </div>
                  <span className="text-xl font-bold font-mono">
                    {integration?.successCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Failed Attempts</p>
                      <p className="text-[10px] text-white/40">
                        Network or server errors
                      </p>
                    </div>
                  </div>
                  <span className="text-xl font-bold font-mono text-red-400">
                    {integration?.failures || 0}
                  </span>
                </div>
                <div className="flex items-center gap-3 border-t border-white/5 pt-6">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Last Triggered</p>
                    <p className="text-[10px] text-white/40">
                      {integration?.lastTriggeredAt
                        ? new Date(integration.lastTriggeredAt).toLocaleString()
                        : "Never active"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Logs Table Card */}
            {integration?.logs?.length > 0 && (
              <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-8 overflow-hidden">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                  <Terminal className="w-5 h-5 text-gray-400" /> Recent Activity
                </h2>
                <div className="space-y-4">
                  {integration.logs.map((log, i) => (
                    <div
                      key={i}
                      className="group p-4 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            log.status === "success"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {log.status === "success"
                            ? "OK 200"
                            : `ERR ${log.statusCode || "500"}`}
                        </span>
                        <span className="text-[10px] text-white/20">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/70">
                          {log.event}
                        </span>
                        <ChevronDown className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
