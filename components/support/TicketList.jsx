import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusColors = {
  open: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "in-progress":
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  waiting:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  resolved:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

export default function TicketList({ userRole = "user" }) {
  const [filter, setFilter] = useState("all");

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ["supportTickets", userRole, filter],
    queryFn: async () => {
      let url = "/support/tickets";
      if (filter !== "all") {
        url += `?status=${filter}`;
      }
      const response = await axiosInstance.get(url);
      return response.data.tickets || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const tickets = ticketsData || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "open", "in-progress", "waiting", "resolved", "closed"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                filter === status
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {status}
            </button>
          ),
        )}
      </div>

      {/* Tickets */}
      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            No tickets found for this filter
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket._id}
              href={`/${userRole}/support/tickets/${ticket._id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                      {ticket.ticketNumber}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        priorityColors[ticket.priority]
                      }`}
                    >
                      {ticket.priority}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        statusColors[ticket.status]
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                    {ticket.subject}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {ticket.message}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Created{" "}
                      {formatDistanceToNow(new Date(ticket.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {ticket.assignedAgent && (
                      <span>Assigned to: {ticket.assignedAgent.name}</span>
                    )}
                  </div>
                </div>

                <div className="ml-4">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
