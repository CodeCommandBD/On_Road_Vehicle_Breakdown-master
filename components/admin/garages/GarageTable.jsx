"use client";

import { useEffect, useState } from "react";
import { Check, X, Eye, Filter, Loader2, Search } from "lucide-react";
import GarageDetailModal from "./GarageDetailModal";
import axios from "axios";
import { toast } from "react-toastify";

export default function GarageTable() {
  const [garages, setGarages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchGarages = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/admin/garages");
      if (response.data.success) {
        setGarages(response.data.garages);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load garages");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGarages();
  }, []);

  const filteredGarages = garages.filter((g) => {
    const matchesFilter = filter === "all" ? true : g.status === filter;
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAction = async (type, id) => {
    const confirmMsg =
      type === "approve"
        ? "Approve this garage?"
        : "Reject/Deactivate this garage?";
    if (!window.confirm(confirmMsg)) return;

    try {
      const payload =
        type === "approve"
          ? { garageId: id, isVerified: true, isActive: true }
          : { garageId: id, isVerified: false, isActive: false };

      const response = await axios.put("/api/admin/garages", payload);
      if (response.data.success) {
        toast.success(
          type === "approve"
            ? "Garage verified successfully"
            : "Garage deactivated"
        );
        fetchGarages();
        setSelectedGarage(null);
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GarageDetailModal
        garage={selectedGarage}
        onClose={() => setSelectedGarage(null)}
        onAction={handleAction}
      />

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Filter Tabs */}
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          {["all", "active", "pending", "inactive"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === tab
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search garage or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">
              <tr>
                <th className="px-6 py-5">Garage Name</th>
                <th className="px-6 py-5">Owner</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredGarages.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Filter className="w-8 h-8" />
                      <p className="text-sm">
                        No garages matching your criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGarages.map((garage) => (
                  <tr
                    key={garage._id}
                    className="hover:bg-white/[0.02] group transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white group-hover:text-orange-500 transition-colors">
                        {garage.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/80">
                      {garage.ownerName}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          garage.status === "active"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : garage.status === "pending"
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {garage.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/40 text-xs truncate max-w-[200px]">
                      {garage.address?.street}, {garage.address?.city}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedGarage(garage)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>

                        {(garage.status === "pending" ||
                          garage.status === "inactive") && (
                          <button
                            onClick={() => handleAction("approve", garage._id)}
                            className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-all"
                            title="Approve / Activate"
                          >
                            <Check size={16} />
                          </button>
                        )}

                        {garage.status === "active" && (
                          <button
                            onClick={() => handleAction("reject", garage._id)}
                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                            title="Deactivate"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
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
