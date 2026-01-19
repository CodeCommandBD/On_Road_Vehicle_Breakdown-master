"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import axiosInstance from "@/lib/axios";

export default function UserContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signatureModal, setSignatureModal] = useState({
    show: false,
    contract: null,
  });
  const [signatureData, setSignatureData] = useState({
    name: "",
    designation: "",
  });
  const [signing, setSigning] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await axiosInstance.get("/contracts");
      if (response.data.success) {
        setContracts(response.data.data.contracts);
      }
    } catch (error) {
      console.error("Failed to fetch contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Draft" },
      pending_signature: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-400",
        label: "Pending Signature",
      },
      active: {
        bg: "bg-green-500/20",
        text: "text-green-400",
        label: "Active",
      },
      expired: { bg: "bg-red-500/20", text: "text-red-400", label: "Expired" },
      cancelled: {
        bg: "bg-gray-500/20",
        text: "text-gray-400",
        label: "Cancelled",
      },
    };
    const c = config[status] || config.draft;
    return (
      <span
        className={`${c.bg} ${c.text} px-3 py-1 rounded-full text-xs font-bold uppercase`}
      >
        {c.label}
      </span>
    );
  };

  const handleDownloadPDF = async (contractId, contractNumber) => {
    try {
      // Open contract in new tab
      window.open(`/api/contracts/${contractId}/pdf`, "_blank");
    } catch (error) {
      console.error("Failed to open contract:", error);
      setErrorModal({
        show: true,
        message: "Failed to open contract. Please try again.",
      });
    }
  };

  const handleSignContract = async () => {
    if (!signatureData.name.trim()) {
      setErrorModal({ show: true, message: "Please enter your name" });
      return;
    }

    setSigning(true);
    try {
      const response = await axiosInstance.patch("/contracts", {
        contractId: signatureModal.contract._id,
        action: "sign",
        signedBy: {
          name: signatureData.name,
          designation: signatureData.designation || "Client",
        },
      });

      if (response.data.success) {
        // Refresh contracts
        await fetchContracts();
        // Close signature modal
        setSignatureModal({ show: false, contract: null });
        setSignatureData({ name: "", designation: "" });
        // Show success modal
        setSuccessModal(true);
      }
    } catch (error) {
      console.error("Failed to sign contract:", error);
      setErrorModal({
        show: true,
        message: "Failed to sign contract. Please try again.",
      });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-white/5 rounded"></div>
          <div className="h-64 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FileText className="w-8 h-8 text-orange-500" />
          My Contracts
        </h1>
        <p className="text-white/60 mt-1">
          View and manage your enterprise contracts
        </p>
      </div>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-12 text-center">
          <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            No Contracts Yet
          </h3>
          <p className="text-white/60">
            You don't have any enterprise contracts at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {contracts.map((contract) => (
            <div
              key={contract._id}
              className="bg-white/5 rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {contract.contractNumber}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {contract.planId?.name || "Enterprise Plan"}
                  </p>
                </div>
                {getStatusBadge(contract.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Amount</p>
                    <p className="text-white font-bold">
                      {contract.pricing?.currency}{" "}
                      {contract.pricing?.amount?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Start Date</p>
                    <p className="text-white font-medium">
                      {new Date(contract.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">End Date</p>
                    <p className="text-white font-medium">
                      {new Date(contract.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Features */}
              {contract.metadata?.customFeatures?.length > 0 && (
                <div className="mb-4">
                  <p className="text-white/60 text-xs mb-2">
                    Included Features:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contract.metadata.customFeatures.map((feature, idx) => (
                      <span
                        key={idx}
                        className="bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full text-orange-300 text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() =>
                    handleDownloadPDF(contract._id, contract.contractNumber)
                  }
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  View Contract
                </button>

                {contract.status === "pending_signature" && (
                  <button
                    onClick={() => setSignatureModal({ show: true, contract })}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Sign Contract
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signature Modal */}
      {signatureModal.show && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full p-8 border border-orange-500/20 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">
              Sign Contract
            </h3>
            <p className="text-white/60 mb-6">
              Please provide your signature details to activate the contract.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={signatureData.name}
                  onChange={(e) =>
                    setSignatureData({ ...signatureData, name: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Designation (Optional)
                </label>
                <input
                  type="text"
                  value={signatureData.designation}
                  onChange={(e) =>
                    setSignatureData({
                      ...signatureData,
                      designation: e.target.value,
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none"
                  placeholder="CEO / Manager"
                />
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                ⚠️ By signing, you agree to all terms and conditions stated in
                the contract.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSignatureModal({ show: false, contract: null });
                  setSignatureData({ name: "", designation: "" });
                }}
                disabled={signing}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSignContract}
                disabled={signing}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {signing ? "Signing..." : "Sign & Activate"}
                <CheckCircle size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full p-8 border border-green-500/20 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Contract Signed Successfully!
              </h3>
              <p className="text-white/60 mb-6">
                Your enterprise contract is now active. You can download the
                signed PDF anytime.
              </p>
              <button
                onClick={() => setSuccessModal(false)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Great!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full p-8 border border-red-500/20 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Error</h3>
              <p className="text-white/60 mb-6">{errorModal.message}</p>
              <button
                onClick={() => setErrorModal({ show: false, message: "" })}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
