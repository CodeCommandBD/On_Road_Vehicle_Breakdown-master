"use client";

import { Siren, Phone, MapPin, CheckCircle } from "lucide-react";

const sosAlerts = [
  {
    id: 1,
    user: "Rahim Uddin",
    phone: "01712345678",
    location: "Mohakhali Flyover, Dhaka",
    time: "2 mins ago",
    status: "pending",
  },
  {
    id: 2,
    user: "Karim Hasan",
    phone: "01812345678",
    location: "Banani Road 11",
    time: "15 mins ago",
    status: "assigned",
  },
];

export default function EmergencySOS() {
  return (
    <div className="bg-[#121212] rounded-2xl border border-red-500/20 overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.05)] mb-8">
      <div className="bg-gradient-to-r from-red-500/10 to-transparent px-6 py-4 border-b border-red-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 bg-red-500/10 rounded-full border border-red-500/20">
            <Siren className="text-red-500 animate-pulse relative z-10" size={20} />
            <span className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></span>
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Emergency SOS Actions</h3>
            <p className="text-xs text-red-400">Immediate attention required</p>
          </div>
        </div>
        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-red-500/20 animate-pulse">2 Active Requirements</span>
      </div>

      <div className="divide-y divide-white/5">
        {sosAlerts.map((alert) => (
          <div key={alert.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-red-500/5 transition-colors group">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-white text-lg">{alert.user}</span>
                <span className="text-xs text-white/30">• {alert.time}</span>
                {alert.status === 'pending' && (
                  <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Critical
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-white/50">
                <div className="flex items-center gap-2 group-hover:text-white/80 transition-colors">
                  <Phone size={14} className="text-[#FF532D]" /> {alert.phone}
                </div>
                <div className="hidden sm:block w-1 h-1 bg-white/10 rounded-full"></div>
                <div className="flex items-center gap-2 group-hover:text-white/80 transition-colors">
                  <MapPin size={14} className="text-[#FF532D]" /> {alert.location}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
            {/* Left buttons same but styled better */}
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 hover:border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all group-hover:translate-x-0">
                <Phone size={16} className="text-green-500" /> Call
              </button>
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#FF532D] hover:bg-[#F23C13] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-orange-500/20">
                <CheckCircle size={16} /> Assign Mechanic
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
