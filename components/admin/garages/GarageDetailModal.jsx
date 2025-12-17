"use client";

import { X, MapPin, Phone, Mail, Clock, ShieldCheck, Star } from "lucide-react";

export default function GarageDetailModal({ garage, onClose, onAction }) {
  if (!garage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1E1E1E] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {garage.name}
              {garage.isVerified && <ShieldCheck className="text-blue-500" size={20} />}
            </h2>
            <p className="text-white/60 text-sm mt-1">Status: <span className="capitalize">{garage.status}</span></p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Work Info / Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4">
                <h3 className="text-white/80 font-semibold border-b border-white/5 pb-2">Contact Info</h3>
                <div className="space-y-3 text-sm text-white/70">
                   <div className="flex items-center gap-3"><Phone size={16} /> {garage.phone}</div>
                   <div className="flex items-center gap-3"><Mail size={16} /> {garage.email}</div>
                   <div className="flex items-center gap-3"><MapPin size={16} /> {garage.address}</div>
                </div>
             </div>

             <div className="space-y-4">
                <h3 className="text-white/80 font-semibold border-b border-white/5 pb-2">Business Details</h3>
                <div className="space-y-3 text-sm text-white/70">
                   <div className="flex justify-between">
                     <span>License No:</span>
                     <span className="text-white">{garage.licenseNumber || "N/A"}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Owner:</span>
                     <span className="text-white">{garage.owner}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Rating:</span>
                     <span className="text-yellow-500 flex items-center gap-1"><Star size={14} fill="currentColor" /> {garage.rating}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Operating Hours */}
          <div>
             <h3 className="text-white/80 font-semibold border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
               <Clock size={18} /> Operating Hours
             </h3>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               {Object.entries(garage.hours || {}).map(([day, time]) => (
                 <div key={day} className="bg-white/5 p-3 rounded-lg text-center">
                   <div className="text-white/40 text-xs uppercase mb-1">{day}</div>
                   <div className="text-white text-sm font-medium">{time}</div>
                 </div>
               ))}
             </div>
          </div>

          {/* Services Offered */}
          <div>
             <h3 className="text-white/80 font-semibold border-b border-white/5 pb-2 mb-4">Services Offered</h3>
             <div className="flex flex-wrap gap-2">
               {(garage.services || []).map((service, idx) => (
                 <span key={idx} className="bg-[#FF532D]/10 text-[#FF532D] px-3 py-1 rounded-full text-sm font-medium border border-[#FF532D]/20">
                   {service}
                 </span>
               ))}
             </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
           {garage.status === 'pending' && (
             <>
               <button 
                onClick={() => onAction('reject', garage.id)}
                className="px-4 py-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
               >
                 Reject Request
               </button>
               <button 
                onClick={() => onAction('approve', garage.id)}
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
               >
                 Approve Garage
               </button>
             </>
           )}
           {garage.status !== 'pending' && (
              <button 
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Close
              </button>
           )}
        </div>

      </div>
    </div>
  );
}
