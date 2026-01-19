"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  X,
  Search,
  Download,
} from "lucide-react";
import axiosInstance from "@/lib/axios";

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [userNotFoundModal, setUserNotFoundModal] = useState({
    show: false,
    email: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInquiries();
    }, 500);

    // Mark all new inquiries as contacted when page is viewed (only on first load)
    if (!search && statusFilter === "all") {
      const markAsViewed = async () => {
        try {
          await axiosInstance.patch("/admin/inquiries/mark-viewed");
        } catch (error) {
          console.error("Failed to mark as viewed:", error);
        }
      };
      markAsViewed();
    }
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const fetchInquiries = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await axiosInstance.get(
        `/admin/inquiries?${params.toString()}`,
      );
      if (response.data.success) {
        setInquiries(response.data.inquiries);
      }
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axiosInstance.patch("/admin/inquiries", { inquiryId: id, status });
      fetchInquiries(); // Refresh
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleExport = () => {
    if (!inquiries.length) return alert("No inquiries to export");

    const headers = [
      "Date",
      "Name",
      "Company",
      "Email",
      "Phone",
      "Status",
      "Message",
    ];

    const csvContent = [
      headers.join(","),
      ...inquiries.map((i) =>
        [
          new Date(i.createdAt).toLocaleDateString(),
          `"${i.name || ""}"`,
          `"${i.company || ""}"`,
          `"${i.email || ""}"`,
          `"${i.phone || ""}"`,
          i.status,
          `"${i.message?.replace(/"/g, '""') || ""}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `inquiries_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    const config = {
      new: { bg: "bg-blue-500/20", text: "text-blue-400", label: "New" },
      contacted: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-400",
        label: "Contacted",
      },
      qualified: {
        bg: "bg-green-500/20",
        text: "text-green-400",
        label: "Qualified",
      },
      closed: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Closed" },
    };
    const c = config[status] || config.new;
    return (
      <span
        className={`${c.bg} ${c.text} px-3 py-1 rounded-full text-xs font-bold uppercase`}
      >
        {c.label}
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
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Mail className="w-8 h-8 text-orange-500" />
          Enterprise Inquiries
        </h1>
        <p className="text-white/60 mt-1">Manage contact sales submissions</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="flex-1 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name, email or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white/20"
          >
            <option value="all" className="bg-[#1A1A1A]">
              All Status
            </option>
            <option value="new" className="bg-[#1A1A1A]">
              New
            </option>
            <option value="contacted" className="bg-[#1A1A1A]">
              Contacted
            </option>
            <option value="qualified" className="bg-[#1A1A1A]">
              Qualified
            </option>
            <option value="closed" className="bg-[#1A1A1A]">
              Closed
            </option>
          </select>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-600/20 rounded-lg transition-colors font-medium"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4">
          <div className="text-blue-400 text-sm font-medium">
            Total Inquiries
          </div>
          <div className="text-3xl font-bold text-white mt-1">
            {inquiries.length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-4">
          <div className="text-orange-400 text-sm font-medium">New</div>
          <div className="text-3xl font-bold text-white mt-1">
            {inquiries.filter((i) => i.status === "new").length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-4">
          <div className="text-yellow-400 text-sm font-medium">Contacted</div>
          <div className="text-3xl font-bold text-white mt-1">
            {inquiries.filter((i) => i.status === "contacted").length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4">
          <div className="text-green-400 text-sm font-medium">Qualified</div>
          <div className="text-3xl font-bold text-white mt-1">
            {inquiries.filter((i) => i.status === "qualified").length}
          </div>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left p-4 text-white/70 font-bold text-sm">
                  Date
                </th>
                <th className="text-left p-4 text-white/70 font-bold text-sm">
                  Name
                </th>
                <th className="text-left p-4 text-white/70 font-bold text-sm">
                  Company
                </th>
                <th className="text-left p-4 text-white/70 font-bold text-sm">
                  Contact
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
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-12 text-white/40">
                    No inquiries yet
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr
                    key={inquiry._id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedInquiry(inquiry)}
                  >
                    <td className="p-4 text-white/60 text-sm">
                      {new Date(inquiry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="text-white font-medium">
                        {inquiry.name}
                      </div>
                    </td>
                    <td className="p-4 text-white/70">
                      {inquiry.company || "-"}
                    </td>
                    <td className="p-4">
                      <div className="text-white/70 text-sm">
                        {inquiry.email}
                      </div>
                      <div className="text-white/50 text-xs">
                        {inquiry.phone}
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(inquiry.status)}</td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={inquiry.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateStatus(inquiry._id, e.target.value);
                        }}
                        className="bg-black/40 border border-white/10 rounded px-3 py-1 text-white text-sm focus:border-orange-500 outline-none"
                      >
                        <option value="new" className="bg-[#1A1A1A] text-white">
                          New
                        </option>
                        <option
                          value="contacted"
                          className="bg-[#1A1A1A] text-white"
                        >
                          Contacted
                        </option>
                        <option
                          value="qualified"
                          className="bg-[#1A1A1A] text-white"
                        >
                          Qualified
                        </option>
                        <option
                          value="closed"
                          className="bg-[#1A1A1A] text-white"
                        >
                          Closed
                        </option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-[#1a1a1a] rounded-xl max-w-2xl w-full p-8 border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">Inquiry Details</h2>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm">Name</label>
                  <p className="text-white font-medium">
                    {selectedInquiry.name}
                  </p>
                </div>
                <div>
                  <label className="text-white/60 text-sm">Company</label>
                  <p className="text-white font-medium">
                    {selectedInquiry.company || "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm">Email</label>
                  <p className="text-white font-medium">
                    {selectedInquiry.email}
                  </p>
                </div>
                <div>
                  <label className="text-white/60 text-sm">Phone</label>
                  <p className="text-white font-medium">
                    {selectedInquiry.phone}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-white/60 text-sm">Message</label>
                <p className="text-white bg-black/40 rounded-lg p-4 mt-2">
                  {selectedInquiry.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm">Status</label>
                  <div className="mt-2">
                    {getStatusBadge(selectedInquiry.status)}
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-sm">Submitted</label>
                  <p className="text-white mt-2">
                    {new Date(selectedInquiry.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors text-center"
                >
                  Send Email
                </a>
                <a
                  href={`tel:${selectedInquiry.phone}`}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors text-center"
                >
                  Call Now
                </a>
              </div>

              {/* Create Contract Button */}
              <div className="mt-4">
                <button
                  onClick={async () => {
                    try {
                      // Check if user exists with this email
                      const userCheck = await axiosInstance.get(
                        `/admin/users/find-by-email?email=${selectedInquiry.email}`,
                      );

                      if (userCheck.data.success && userCheck.data.user) {
                        // User exists, redirect to contracts page with pre-filled data
                        window.location.href = `/admin/contracts?userId=${userCheck.data.user._id}&email=${selectedInquiry.email}`;
                      } else {
                        // User doesn't exist, show modal
                        setUserNotFoundModal({
                          show: true,
                          email: selectedInquiry.email,
                        });
                      }
                    } catch (error) {
                      console.error("Error checking user:", error);
                      setUserNotFoundModal({
                        show: true,
                        email: selectedInquiry.email,
                      });
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Create Enterprise Contract
                </button>
                <p className="text-xs text-white/40 mt-2 text-center">
                  User must have an account to create contract
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Not Found Modal */}
      {userNotFoundModal.show && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full p-8 border border-yellow-500/20 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                User Not Found
              </h3>
              <p className="text-white/60 mb-4">
                No registered user found with email:
              </p>
              <p className="text-orange-400 font-mono text-sm mb-6">
                {userNotFoundModal.email}
              </p>
              <p className="text-white/60 text-sm mb-6">
                Please ask them to create an account first, or you can create
                one for them from the Users page.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setUserNotFoundModal({ show: false, email: "" })
                  }
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.location.href = "/admin/users";
                  }}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Go to Users
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
