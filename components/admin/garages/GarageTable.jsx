"use client";

import { useState } from "react";
import { Check, X, Eye, Filter } from "lucide-react";
import GarageDetailModal from "./GarageDetailModal";

// Mock Data
const mockGarages = [
  { 
    id: 1, 
    name: "Master Fix Auto", 
    owner: "Abdul Karim", 
    phone: "01711223344", 
    email: "karim@fixit.com", 
    status: "active", 
    address: "123 Tejgaon Ind. Area, Dhaka",
    rating: 4.8,
    isVerified: true,
    services: ["Engine Repair", "Tire Change", "Oil Change", "Brake Service"],
    hours: { Mon: "9am - 8pm", Tue: "9am - 8pm", Wed: "9am - 8pm", Thu: "9am - 8pm", Fri: "Closed", Sat: "10am - 6pm", Sun: "10am - 6pm" }
  },
  { 
    id: 2, 
    name: "Speedy Motors", 
    owner: "Rahim Uddin", 
    phone: "01998877665", 
    email: "speedy@gmail.com", 
    status: "pending", 
    address: "45 Banani Road 11, Dhaka",
    rating: 0, 
    isVerified: false,
    services: ["Car Wash", "Tire Change"],
    hours: { Mon: "8am - 10pm", Tue: "8am - 10pm", Wed: "8am - 10pm", Thu: "8am - 10pm", Fri: "2pm - 10pm", Sat: "8am - 10pm", Sun: "8am - 10pm" }
  },
  { 
    id: 3, 
    name: "Dhaka Wheels", 
    owner: "Salam Mia", 
    phone: "01812345678", 
    email: "salam@wheels.com", 
    status: "rejected", 
    address: "Mirpur 10, Dhaka",
    rating: 0,
    isVerified: false,
    services: ["General Service"],
    hours: { Mon: "10am - 6pm", Fri: "Closed" }
  },
];

export default function GarageTable() {
  const [garages, setGarages] = useState(mockGarages);
  const [filter, setFilter] = useState("all"); // all, active, pending, rejected
  const [selectedGarage, setSelectedGarage] = useState(null);

  const filteredGarages = garages.filter(g => 
    filter === "all" ? true : g.status === filter
  );

  const handleAction = (type, id) => {
    if (type === 'approve') {
       if(confirm("Approve this garage?")) {
         setGarages(garages.map(g => g.id === id ? { ...g, status: 'active', isVerified: true } : g));
         setSelectedGarage(null);
       }
    } else if (type === 'reject') {
       if(confirm("Reject this garage application?")) {
        setGarages(garages.map(g => g.id === id ? { ...g, status: 'rejected' } : g));
        setSelectedGarage(null);
       }
    }
  };

  return (
    <div className="space-y-6">
      <GarageDetailModal 
        garage={selectedGarage} 
        onClose={() => setSelectedGarage(null)} 
        onAction={handleAction} 
      />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'active', 'pending', 'rejected'].map(tab => (
           <button
             key={tab}
             onClick={() => setFilter(tab)}
             className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
               filter === tab 
                 ? "bg-[#FF532D] text-white" 
                 : "bg-[#1E1E1E] text-white/60 hover:text-white hover:bg-white/10"
             }`}
           >
             {tab}
           </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#1E1E1E] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-white/60 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Garage Name</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredGarages.length === 0 ? (
                <tr>
                   <td colSpan="5" className="px-6 py-8 text-center text-white/40">
                      No garages found in this category.
                   </td>
                </tr>
              ) : (
                filteredGarages.map((garage) => (
                  <tr key={garage.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{garage.name}</td>
                    <td className="px-6 py-4 text-white/80">{garage.owner}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${
                        garage.status === 'active' 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : garage.status === 'pending'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {garage.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60 text-sm truncate max-w-[200px]">{garage.address}</td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                       <button 
                         onClick={() => setSelectedGarage(garage)}
                         className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs font-medium text-white transition-colors"
                       >
                         <Eye size={14} /> View Details
                       </button>

                       {garage.status === 'pending' && (
                         <>
                            <button 
                              onClick={() => handleAction('approve', garage.id)}
                              className="p-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors" 
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={() => handleAction('reject', garage.id)}
                              className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors" 
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                         </>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
