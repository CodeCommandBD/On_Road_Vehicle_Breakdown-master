"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Wrench, Battery, Droplets, Zap } from "lucide-react";

const initialServices = [
  { id: 1, name: "Tire Change", icon: "Wrench", price: "500", active: true },
  { id: 2, name: "Oil Change", icon: "Droplets", price: "1500", active: true },
  { id: 3, name: "Battery Jumpstart", icon: "Battery", price: "1000", active: true },
  { id: 4, name: "EV Charging", icon: "Zap", price: "2000", active: false },
];

const icons = {
  Wrench: Wrench,
  Battery: Battery,
  Droplets: Droplets,
  Zap: Zap,
};

export default function ServiceList() {
  const [services, setServices] = useState(initialServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newService, setNewService] = useState({ name: "", price: "", icon: "Wrench" });

  const handleAddService = () => {
    if (newService.name && newService.price) {
      setServices([...services, { id: services.length + 1, ...newService, active: true }]);
      setIsModalOpen(false);
      setNewService({ name: "", price: "", icon: "Wrench" });
    }
  };

  const handleDelete = (id) => {
    if(confirm("Delete this service category?")) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add New Card */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="border border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-white/5 transition-colors group h-full"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-[#FF532D] transition-colors">
            <Plus size={24} />
          </div>
          <span className="text-white font-medium">Add New Service</span>
        </button>

        {/* Service Cards */}
        {services.map((service) => {
          const Icon = icons[service.icon] || Wrench;
          return (
            <div key={service.id} className="bg-[#1E1E1E] rounded-xl border border-white/5 p-6 relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white" title="Edit">
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(service.id)}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500" title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="w-12 h-12 rounded-lg bg-[#FF532D]/10 text-[#FF532D] flex items-center justify-center mb-4">
                <Icon size={24} />
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{service.name}</h3>
              <p className="text-white/60 text-sm mb-4">Base Price: ৳{service.price}</p>

              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  service.active 
                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                    : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                }`}>
                  {service.active ? "Active" : "Inactive"}
                </span>
                <span className="text-white/40 text-xs">ID: {service.id}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simple Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E1E1E] w-full max-w-md rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-6">Add New Service</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Service Name</label>
                <input 
                  type="text" 
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#FF532D]"
                  placeholder="e.g. Engine Repair"
                  value={newService.name}
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">Base Price (৳)</label>
                <input 
                  type="number" 
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#FF532D]"
                  placeholder="e.g. 500"
                  value={newService.price}
                  onChange={(e) => setNewService({...newService, price: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">Icon</label>
                <select 
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#FF532D]"
                  value={newService.icon}
                  onChange={(e) => setNewService({...newService, icon: e.target.value})}
                >
                  <option value="Wrench">Wrench (Repair)</option>
                  <option value="Battery">Battery (Electrical)</option>
                  <option value="Droplets">Droplets (Oil/Fluids)</option>
                  <option value="Zap">Zap (EV/Charging)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddService}
                  className="flex-1 py-2 rounded-lg bg-[#FF532D] text-white font-medium hover:bg-[#F23C13]"
                >
                  Create Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
