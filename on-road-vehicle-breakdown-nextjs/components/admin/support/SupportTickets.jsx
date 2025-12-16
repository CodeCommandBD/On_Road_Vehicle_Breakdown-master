"use client";

import { useState } from "react";
import { MessageSquare, AlertTriangle, CheckCircle, Clock } from "lucide-react";

// Mock Data
const initialTickets = [
  { id: "T-1001", user: "Rahim Uddin", subject: "NO GARAGE FOUND - URGENT", type: "SOS", status: "Open", date: "Just now", message: "I am stuck at Mohakhali Flyover with a flat tire at night. No garage is showing up on the map. Please help!" },
  { id: "T-1002", user: "Sadia Islam", subject: "Overcharged for service", type: "Dispute", status: "In Progress", date: "2 hours ago", message: "The mechanic agreed on 500tk but took 800tk." },
  { id: "T-1003", user: "Karim Hasan", subject: "Mechanic did not arrive", type: "Complaint", status: "Resolved", date: "Yesterday", message: "I waited for 1 hour but nobody came." },
];

export default function SupportTickets() {
  const [tickets, setTickets] = useState(initialTickets);
  const [filter, setFilter] = useState("All");

  const filteredTickets = tickets.filter(t => filter === "All" || t.status === filter || (filter === 'SOS' && t.type === 'SOS'));

  const handleResolve = (id) => {
    if(confirm("Mark this ticket as Resolved?")) {
      setTickets(tickets.map(t => t.id === id ? { ...t, status: "Resolved" } : t));
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2">
        {['All', 'Open', 'In Progress', 'Resolved', 'SOS'].map(tab => (
           <button
             key={tab}
             onClick={() => setFilter(tab)}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
               filter === tab 
                 ? "bg-[#FF532D] text-white" 
                 : "bg-[#1E1E1E] text-white/60 hover:text-white hover:bg-white/10"
             }`}
           >
             {tab}
           </button>
        ))}
      </div>

      {/* Ticket List */}
      <div className="grid gap-4">
        {filteredTickets.map((ticket) => (
          <div key={ticket.id} className={`bg-[#1E1E1E] rounded-xl border p-6 transition-all ${
            ticket.type === 'SOS' 
              ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
              : 'border-white/5 hover:border-white/10'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                  ticket.type === 'SOS' ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white/60'
                }`}>
                  {ticket.type}
                </span>
                <h3 className="text-lg font-bold text-white">{ticket.subject}</h3>
              </div>
              <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border ${
                ticket.status === 'Resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                ticket.status === 'Open' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                'bg-blue-500/10 text-blue-500 border-blue-500/20'
              }`}>
                {ticket.status === 'Resolved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                {ticket.status}
              </span>
            </div>

            <p className="text-white/70 text-sm mb-4 bg-black/20 p-4 rounded-lg">
              &quot;{ticket.message}&quot;
            </p>

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex items-center gap-4 text-sm text-white/40">
                <span className="flex items-center gap-2"><MessageSquare size={14} /> {ticket.user}</span>
                <span>•</span>
                <span>{ticket.date}</span>
                <span>•</span>
                <span>ID: {ticket.id}</span>
              </div>
              
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 text-sm transition-colors">
                  View Chat
                </button>
                {ticket.status !== 'Resolved' && (
                  <button 
                    onClick={() => handleResolve(ticket.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    Resolve Issue
                  </button>
                )}
                {ticket.type === 'SOS' && ticket.status !== 'Resolved' && (
                  <button className="px-4 py-2 bg-[#FF532D] hover:bg-[#F23C13] rounded-lg text-white text-sm font-medium transition-colors animate-pulse">
                    Manual Assign
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredTickets.length === 0 && (
          <div className="text-center py-12 text-white/40 bg-[#1E1E1E] rounded-xl border border-white/5">
            No tickets found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
