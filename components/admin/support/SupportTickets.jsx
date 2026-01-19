"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Download,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { toast } from "react-toastify";

export default function SupportTickets() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const { data: ticketsData, isLoading: loading } = useQuery({
    queryKey: ["adminSupportTickets", filter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filter !== "All" && filter !== "SOS") params.append("status", filter);
      const response = await axiosInstance.get(
        `/api/admin/support?${params.toString()}`,
      );
      return response.data.tickets || [];
    },
  });

  const tickets = ticketsData || [];

  const resolveMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axiosInstance.patch("/api/admin/support", {
        ticketId: id,
        status: "resolved",
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Ticket resolved");
      queryClient.invalidateQueries({ queryKey: ["adminSupportTickets"] });
    },
    onError: () => {
      toast.error("Failed to resolve ticket");
    },
  });

  const filteredTickets = tickets.filter(
    (t) => filter !== "SOS" || t.priority === "urgent",
  );

  const handleResolve = async (id) => {
    if (confirm("Mark this ticket as Resolved?")) {
      resolveMutation.mutate(id);
    }
  };

  const handleExport = () => {
    if (!tickets.length) return alert("No tickets to export");

    const headers = [
      "Subject",
      "User",
      "Email",
      "Type",
      "Priority",
      "Status",
      "Message",
      "Date",
    ];

    const csvContent = [
      headers.join(","),
      ...tickets.map((t) =>
        [
          `"${t.subject?.replace(/"/g, '""') || ""}"`,
          `"${t.userId?.name || "N/A"}"`,
          `"${t.userId?.email || "N/A"}"`,
          "Support", // Type
          t.priority,
          t.status,
          `"${t.message?.replace(/"/g, '""') || ""}"`,
          new Date(t.createdAt).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `support_tickets_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {["All", "Pending", "In_progress", "Resolved"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === tab
                  ? "bg-[#FF532D] text-white"
                  : "bg-[#1E1E1E] text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Search & Export */}
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              size={18}
            />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-white/20"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Ticket List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket._id}
              className={`bg-[#1E1E1E] rounded-xl border p-6 transition-all ${
                ticket.priority === "urgent"
                  ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                      ticket.priority === "urgent"
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {ticket.priority}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {ticket.subject}
                  </h3>
                </div>
                <span
                  className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border box-capitalize ${
                    ticket.status === "resolved"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : ticket.status === "pending"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  }`}
                >
                  {ticket.status === "resolved" ? (
                    <CheckCircle size={12} />
                  ) : (
                    <Clock size={12} />
                  )}
                  <span className="capitalize">
                    {ticket.status.replace("_", " ")}
                  </span>
                </span>
              </div>

              <p className="text-white/70 text-sm mb-4 bg-black/20 p-4 rounded-lg">
                &quot;{ticket.message}&quot;
              </p>

              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <div className="flex items-center gap-4 text-sm text-white/40">
                  <span className="flex items-center gap-2">
                    <MessageSquare size={14} />{" "}
                    {ticket.userId?.name || "Unknown User"}
                  </span>
                  <span>•</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 text-sm transition-colors">
                    View Chat
                  </button>
                  {ticket.status !== "resolved" && (
                    <button
                      onClick={() => handleResolve(ticket._id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      Resolve Issue
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {filteredTickets.length === 0 && (
          <div className="text-center py-12 text-white/40 bg-[#1E1E1E] rounded-xl border border-white/5">
            No tickets found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
