"use client";

import { useState } from "react";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import axios from "axios";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

export default function CreateOrganizationPage() {
  const router = useRouterWithLoading(); // Regular routing
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("success"); // 'success' or 'error'
  const [modalMessage, setModalMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    webhookUrl: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
      };

      // Add optional fields if provided
      if (formData.webhookUrl || formData.contactName) {
        payload.settings = {};
        if (formData.webhookUrl) {
          payload.settings.webhookUrl = formData.webhookUrl;
        }
      }

      if (formData.contactName || formData.contactEmail) {
        payload.billingInfo = {};
        if (formData.contactName)
          payload.billingInfo.contactName = formData.contactName;
        if (formData.contactEmail)
          payload.billingInfo.contactEmail = formData.contactEmail;
        if (formData.contactPhone)
          payload.billingInfo.contactPhone = formData.contactPhone;
      }

      const res = await axios.post("/api/organizations", payload);

      if (res.data.success) {
        setModalType("success");
        setModalMessage("Organization created successfully!");
        setShowModal(true);

        // Redirect after 1.5 seconds
        setTimeout(() => {
          router.push("/user/dashboard/team");
        }, 1500);
      }
    } catch (error) {
      console.error("Create organization error:", error);
      setModalType("error");
      setModalMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to create organization. Please try again."
      );
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">
            Create Organization
          </h1>
          <p className="text-gray-400">
            Set up your team workspace and start collaborating
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8"
        >
          {/* Organization Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Organization Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="My Company Ltd"
            />
            <p className="text-sm text-gray-500 mt-1">
              Choose a name for your organization
            </p>
          </div>

          {/* Webhook URL (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Slack Webhook URL{" "}
              <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="url"
              value={formData.webhookUrl}
              onChange={(e) =>
                setFormData({ ...formData, webhookUrl: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="https://hooks.slack.com/services/..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Set up team notifications (you can add this later)
            </p>
          </div>

          <div className="border-t border-gray-700 my-6 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Billing Contact{" "}
              <span className="text-gray-500 text-sm">(Optional)</span>
            </h3>

            {/* Contact Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) =>
                  setFormData({ ...formData, contactName: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Ahmed Khan"
              />
            </div>

            {/* Contact Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData({ ...formData, contactEmail: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="billing@company.com"
              />
            </div>

            {/* Contact Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) =>
                  setFormData({ ...formData, contactPhone: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="01712345678"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? "Creating..." : "Create Organization"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-all"
            >
              Cancel
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4 text-center">
            You will be assigned as the organization owner with full access
          </p>
        </form>
      </div>

      {/* Success/Error Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 max-w-md w-full mx-4 transform transition-all">
            <div className="text-center">
              {modalType === "success" ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              )}

              <h3
                className={`text-2xl font-bold mb-2 ${
                  modalType === "success" ? "text-green-400" : "text-red-400"
                }`}
              >
                {modalType === "success" ? "Success!" : "Error"}
              </h3>

              <p className="text-gray-300 mb-6">{modalMessage}</p>

              {modalType === "error" && (
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Close
                </button>
              )}

              {modalType === "success" && (
                <div className="text-sm text-gray-400">
                  Redirecting to team page...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
