"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Users,
  Send,
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export default function NewsletterPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("compose");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const { data: subscriberData, isLoading: loading } = useQuery({
    queryKey: ["newsletterSubscribers"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        "/api/admin/newsletter/subscribers",
      );
      return response.data.data;
    },
    initialData: {
      subscribers: [],
      stats: { total: 0, active: 0, inactive: 0 },
    },
  });

  const subscribers = subscriberData.subscribers;
  const stats = subscriberData.stats;

  const testMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await axiosInstance.post(
        "/api/admin/newsletter/send-test",
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Test email sent successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send test email");
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await axiosInstance.post(
        "/api/admin/newsletter/send-bulk",
        payload,
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Newsletter sent to ${data.data.sentCount} subscribers!`);
      setSubject("");
      setContent("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send newsletter");
    },
  });

  const handleSendTest = () => {
    if (!testEmail || !subject || !content) {
      toast.error("Please fill all fields and provide a test email");
      return;
    }
    testMutation.mutate({ email: testEmail, subject, content });
  };

  const handleSendToAll = () => {
    if (!subject || !content) {
      toast.error("Please fill subject and content");
      return;
    }
    if (!confirm(`Send newsletter to ${stats.active} subscribers?`)) {
      return;
    }
    bulkMutation.mutate({ subject, content });
  };

  const isSending = testMutation.isPending || bulkMutation.isPending;

  return (
    <div className="min-h-screen bg-[#111] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Newsletter Management
          </h1>
          <p className="text-gray-400">
            Manage subscribers and send newsletters
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Total Subscribers"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Active Subscribers"
            value={stats.active}
            color="green"
          />
          <StatCard
            icon={AlertCircle}
            label="Inactive"
            value={stats.inactive}
            color="orange"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <TabButton
            active={activeTab === "compose"}
            onClick={() => setActiveTab("compose")}
            icon={Mail}
            label="Compose"
          />
          <TabButton
            active={activeTab === "subscribers"}
            onClick={() => setActiveTab("subscribers")}
            icon={Users}
            label="Subscribers"
          />
        </div>

        {/* Content */}
        {activeTab === "compose" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Composer */}
            <div className="glass-card p-6 rounded-xl">
              <h2 className="text-xl font-bold text-white mb-6">
                Compose Newsletter
              </h2>

              <div className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your newsletter content..."
                    rows={12}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                {/* Test Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Test Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={handleSendTest}
                      disabled={isSending}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Test
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={handleSendToAll}
                    disabled={isSending || !subject || !content}
                    className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-bold"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send to All ({stats.active})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="glass-card p-6 rounded-xl">
              <h2 className="text-xl font-bold text-white mb-6">Preview</h2>
              {showPreview ? (
                <div className="bg-white rounded-lg p-6 min-h-[400px]">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {subject || "Subject will appear here"}
                  </h3>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {content || "Content will appear here..."}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-gray-500">
                  Click "Preview" to see how your email will look
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "subscribers" && (
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Subscriber List ({subscribers.length})
              </h2>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        Subscribed
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub) => (
                      <tr
                        key={sub._id}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="py-3 px-4 text-white">{sub.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sub.isActive
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {sub.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {new Date(sub.subscribedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {sub.source}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
        active
          ? "border-orange-500 text-orange-500"
          : "border-transparent text-gray-400 hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
