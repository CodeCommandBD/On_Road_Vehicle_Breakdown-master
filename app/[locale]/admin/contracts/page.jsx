"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Download, Eye, Search } from "lucide-react";
import axios from "axios";
import CreateContractModal from "@/components/admin/contracts/CreateContractModal";

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContracts();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchContracts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const response = await axios.get(`/api/contracts?${params.toString()}`);
      if (response.data.success) {
        setContracts(response.data.data.contracts);
      }
    } catch (error) {
      console.error("Failed to fetch contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (contractId, contractNumber) => {
    try {
      const response = await axios.get(`/api/contracts/${contractId}/pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `contract-${contractNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download PDF");
    }
  };

  const handleExport = () => {
    if (!contracts.length) return alert("No contracts to export");

    const headers = [
      "Contract #",
      "Client Name",
      "Client Email",
      "Plan",
      "Amount",
      "Start Date",
      "End Date",
      "Status",
    ];

    const csvContent = [
      headers.join(","),
      ...contracts.map((c) =>
        [
          c.contractNumber,
          `"${c.userId?.name || ""}"`,
          `"${c.userId?.email || ""}"`,
          `"${c.planId?.name || ""}"`,
          `${c.pricing?.currency} ${c.pricing?.amount}`,
          new Date(c.startDate).toLocaleDateString(),
          new Date(c.endDate).toLocaleDateString(),
          c.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `contracts_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
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

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span
        className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-bold uppercase`}
      >
        {config.label}
      </span>
    );
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-orange-500" />
            Enterprise Contracts
          </h1>
          <p className="text-white/60 mt-1">
            Manage custom enterprise agreements
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-orange-600/20"
        >
          <Plus size={20} />
          Create Contract
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by contract #, client name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
          />
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4">
          <div className="text-blue-400 text-sm font-medium">
            Total Contracts
          </div>
          <div className="text-3xl font-bold text-white mt-1">
            {contracts.length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4">
          <div className="text-green-400 text-sm font-medium">Active</div>
          <div className="text-3xl font-bold text-white mt-1">
            {contracts.filter((c) => c.status === "active").length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-4">
          <div className="text-yellow-400 text-sm font-medium">Pending</div>
          <div className="text-3xl font-bold text-white mt-1">
            {contracts.filter((c) => c.status === "pending_signature").length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-4">
          <div className="text-purple-400 text-sm font-medium">This Month</div>
          <div className="text-3xl font-bold text-white mt-1">
            {
              contracts.filter(
                (c) =>
                  new Date(c.createdAt).getMonth() === new Date().getMonth()
              ).length
            }
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left p-4 text-white/70 font-bold text-sm">
                  Contract #
                </th>
                <th className="text-left p-4 text-white/70 font-bold text-sm">
                  Client
                </th>
                <th className="text-left p-4 text-white/70 font-bold text-sm">
                  Plan
                </th>
                <th className="text-left p-4 text-white/70 font-bold text-sm">
                  Amount
                </th>
                <th className="text-left p-4 text-white/70 font-bold text-sm">
                  Duration
                </th>
                <th className="text-left p-4 text-white/70 font-bold text-sm">
                  Status
                </th>
                <th className="text-left p-4 text-white/70 font-bold text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-12 text-white/40">
                    No contracts found. Create your first enterprise contract!
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => (
                  <tr
                    key={contract._id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <span className="text-orange-400 font-mono font-bold">
                        {contract.contractNumber}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-medium">
                        {contract.userId?.name}
                      </div>
                      <div className="text-white/50 text-xs">
                        {contract.userId?.email}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white/80">
                        {contract.planId?.name}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-white font-bold">
                        {contract.pricing?.currency}{" "}
                        {contract.pricing?.amount?.toLocaleString()}
                      </span>
                      <div className="text-white/50 text-xs capitalize">
                        {contract.pricing?.billingCycle}
                      </div>
                    </td>
                    <td className="p-4 text-white/70 text-sm">
                      {new Date(contract.startDate).toLocaleDateString()} -{" "}
                      {new Date(contract.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">{getStatusBadge(contract.status)}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleDownloadPDF(
                              contract._id,
                              contract.contractNumber
                            )
                          }
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Contract Modal */}
      <CreateContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchContracts}
      />
    </div>
  );
}
