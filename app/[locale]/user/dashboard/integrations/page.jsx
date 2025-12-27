"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
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
  const [activeTab, setActiveTab] = useState("webhooks");

  // API Key state
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [generatedKey, setGeneratedKey] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Role Check State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    if (!user) return;

    const isEnterprise =
      user.membershipTier === "enterprise" || user.planTier === "enterprise";

    if (isEnterprise) {
      axios
        .get("/api/organizations")
        .then((res) => {
          const orgs = res.data.data || [];
          const hasAuthRole = orgs.some(
            (o) => o.role === "admin" || o.role === "owner"
          );
          setIsAuthorized(hasAuthRole);
        })
        .catch((err) => {
          console.error("Auth check failed:", err);
          setIsAuthorized(false);
        })
        .finally(() => setRoleChecked(true));
    } else {
      setIsAuthorized(true);
      setRoleChecked(true);
    }
  }, [user]);

  const isPlanEligible =
    ["premium", "enterprise"].includes(user?.membershipTier) ||
    ["premium", "enterprise"].includes(user?.planTier);

  const hasAccess = isPlanEligible && isAuthorized && roleChecked;
  const isRestricted = !isAuthorized && roleChecked && isPlanEligible;
  const isEnterprise =
    user?.membershipTier === "enterprise" || user?.planTier === "enterprise";

  useEffect(() => {
    if (hasAccess) {
      fetchConfig();
      if (isEnterprise) {
        fetchApiKeys();
      }
    } else if (roleChecked) {
      setLoading(false);
    }
  }, [hasAccess, isEnterprise, roleChecked]);

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
      if (!isEnterprise) setLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const res = await axios.get("/api/user/api-keys");
      if (res.data.success) {
        setApiKeys(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch API keys", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await axios.post("/api/user/api-keys", {
        label: newKeyLabel || "Default Key",
      });
      if (res.data.success) {
        setGeneratedKey(res.data.data.key);
        setNewKeyLabel("");
        fetchApiKeys();
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to generate API key." });
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!confirm("Are you sure you want to revoke this API key?")) return;
    try {
      const res = await axios.delete(`/api/user/api-keys?id=${keyId}`);
      if (res.data.success) {
        fetchApiKeys();
        setMessage({ type: "success", text: "API key revoked." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to revoke API key." });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Webhook className="text-purple-500" />
          CRM Integrations
        </h1>
        <p className="text-white/60 mt-2">
          Connect your external systems via Webhooks and API keys to receive
          real-time updates.
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
            {isRestricted
              ? "Access restricted to Organization Owners & Admins."
              : "Available exclusively on **Premium** and **Enterprise** plans."}
          </p>

          {!isRestricted && (
            <Link
              href="/pricing"
              className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all relative z-10"
            >
              Upgrade Now
            </Link>
          )}
        </div>
      ) : (
        <div className="max-w-4xl">
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-white/10">
            <button
              onClick={() => setActiveTab("webhooks")}
              className={`pb-4 px-2 font-medium transition-colors relative ${
                activeTab === "webhooks"
                  ? "text-purple-500"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Webhooks
              {activeTab === "webhooks" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>
            {isEnterprise && (
              <button
                onClick={() => setActiveTab("api")}
                className={`pb-4 px-2 font-medium transition-colors relative ${
                  activeTab === "api"
                    ? "text-purple-500"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                API Access
                {activeTab === "api" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                )}
              </button>
            )}
          </div>

          {activeTab === "webhooks" && (
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
          )}

          {activeTab === "api" && (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8">
                <h2 className="text-xl font-bold mb-6">Generate API Key</h2>
                {generatedKey ? (
                  <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-xl animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-green-400 text-sm font-bold mb-2">
                      Important: Copy your key now!
                    </p>
                    <p className="text-white/60 text-xs mb-4">
                      For security, this key will only be shown once.
                    </p>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-black/40 p-3 rounded-lg text-purple-400 font-mono break-all border border-white/5">
                        {generatedKey}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedKey);
                          alert("Key copied to clipboard!");
                        }}
                        className="bg-purple-600 text-white px-4 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <button
                      onClick={() => setGeneratedKey(null)}
                      className="mt-6 text-sm text-green-400/60 hover:text-green-400 underline"
                    >
                      I've saved my key
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleGenerateKey} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Key Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. My Website, Mobile App"
                        value={newKeyLabel}
                        onChange={(e) => setNewKeyLabel(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={generating}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                      {generating ? "Generating..." : "Generate New Key"}
                    </button>
                  </form>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8">
                <h2 className="text-xl font-bold mb-6">Your API Keys</h2>
                {apiKeys.length === 0 ? (
                  <p className="text-white/40 text-center py-8 italic">
                    No active API keys found.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div
                        key={key._id}
                        className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-white/10 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-white group-hover:text-purple-400 transition-colors">
                            {key.label}
                          </p>
                          <p className="text-xs text-white/40 mt-1">
                            Created:{" "}
                            {new Date(key.createdAt).toLocaleDateString()}
                            {key.lastUsedAt &&
                              ` | Last used: ${new Date(
                                key.lastUsedAt
                              ).toLocaleDateString()}`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRevokeKey(key._id)}
                          className="text-red-500/60 hover:text-red-500 text-sm font-medium transition-colors p-2"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documentation Snippet */}
          <div className="mt-8 bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-blue-400 mb-4">
              Documentation
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-white/70 mb-2">
                  Example Webhook Payload:
                </p>
                <pre className="bg-black/30 p-4 rounded-lg text-xs text-white/70 overflow-x-auto font-mono">
                  {`{
  "id": "uuid-v4",
  "event": "sos.created",
  "data": {
    "sosId": "60d5ec...",
    "status": "pending",
    "vehicleType": "car"
  }
}`}
                </pre>
              </div>

              {isEnterprise && (
                <div>
                  <p className="text-sm text-white/70 mb-2">
                    How to use API Keys:
                  </p>
                  <p className="text-xs text-white/40 mb-3">
                    Include your key in the <code>X-API-Key</code> header for
                    authenticated requests.
                  </p>
                  <pre className="bg-black/30 p-4 rounded-lg text-xs text-white/70 overflow-x-auto font-mono text-purple-400">
                    {`curl -X POST https://on-road.com/api/v1/sos \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"latitude": 23.81, "longitude": 90.41, ...}'`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
