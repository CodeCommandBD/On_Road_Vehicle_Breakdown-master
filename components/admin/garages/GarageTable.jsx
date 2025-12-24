import { useEffect, useState } from "react";
import {
  Check,
  X,
  Eye,
  Filter,
  Loader2,
  Search,
  Award,
  MoreVertical,
  Star,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import GarageDetailModal from "./GarageDetailModal";
import axios from "axios";
import { toast } from "react-toastify";

export default function GarageTable() {
  const [garages, setGarages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

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
    const matchesStatus =
      statusFilter === "all" ? true : g.status === statusFilter;
    const matchesTier =
      tierFilter === "all" ? true : (g.membershipTier || "free") === tierFilter;
    const matchesFeatured =
      featuredFilter === "all"
        ? true
        : featuredFilter === "featured"
        ? g.isFeatured
        : !g.isFeatured;
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.ownerName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesTier && matchesFeatured && matchesSearch;
  });

  const handleAction = async (type, id, value) => {
    try {
      let payload = { garageId: id };
      let successMsg = "";

      switch (type) {
        case "approve":
          payload = { ...payload, isVerified: true, isActive: true };
          successMsg = "Garage verified successfully";
          break;
        case "reject":
          payload = { ...payload, isVerified: false, isActive: false };
          successMsg = "Garage deactivated";
          break;
        case "toggleFeatured":
          payload = { ...payload, isFeatured: value };
          successMsg = value ? "Garage featured" : "Featured status removed";
          break;
        case "adjustPoints":
          const points = window.prompt(
            "Enter points to add/subtract (e.g. 50 or -50):"
          );
          if (points === null) return;
          payload = { ...payload, rewardPoints: Number(points) };
          successMsg = `User points adjusted by ${points}`;
          break;
        default:
          return;
      }

      const response = await axios.put("/api/admin/garages", payload);
      if (response.data.success) {
        toast.success(successMsg);
        fetchGarages();
        setOpenDropdown(null);
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleDropdownClick = (e, garageId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setOpenDropdown(
      openDropdown?.id === garageId
        ? null
        : {
            id: garageId,
            x: rect.left - 160,
            y: rect.top + rect.height + 8,
          }
    );
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

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search garage or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="trial">Trial</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="all">Featured: Any</option>
            <option value="featured">Featured Only</option>
            <option value="non-featured">Non-Featured</option>
          </select>
        </div>

        <div className="text-white/40 text-xs font-medium">
          Showing {filteredGarages.length} of {garages.length} garages
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">
              <tr>
                <th className="px-6 py-5">Garage Info</th>
                <th className="px-6 py-5">Owner</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Membership</th>
                <th className="px-6 py-5 text-center">Reward Pts</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredGarages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
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
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold">
                          {garage.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover:text-orange-500 transition-colors">
                            {garage.name}
                          </div>
                          <div className="text-[10px] text-white/40 uppercase tracking-wider">
                            {garage.address?.city}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white/80 text-sm">
                        {garage.ownerName}
                      </div>
                      <div className="text-white/40 text-xs">
                        {garage.email}
                      </div>
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
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`text-xs font-bold uppercase flex items-center gap-1.5 ${
                            garage.membershipTier === "premium" ||
                            garage.membershipTier === "enterprise"
                              ? "text-purple-400"
                              : "text-white/60"
                          }`}
                        >
                          {(garage.membershipTier === "premium" ||
                            garage.membershipTier === "enterprise" ||
                            garage.membershipTier === "standard") && (
                            <Star size={10} className="fill-current" />
                          )}
                          {garage.membershipTier || "Free"}
                        </span>
                        {garage.isFeatured && (
                          <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded w-fit flex items-center gap-1">
                            <Star size={8} className="fill-current" />
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 font-bold text-orange-500">
                        <Award size={14} />
                        {garage.ownerPoints || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={(e) => handleDropdownClick(e, garage._id)}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                      >
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed Dropdown Menu */}
      {openDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpenDropdown(null)}
          />
          <div
            className="fixed z-50 w-52 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in duration-200"
            style={{ left: openDropdown.x, top: openDropdown.y }}
          >
            <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 mb-1">
              Garage Actions
            </div>

            <button
              onClick={() => {
                const garage = garages.find((g) => g._id === openDropdown.id);
                setSelectedGarage(garage);
                setOpenDropdown(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Eye size={16} className="text-blue-400" />
              View Details
            </button>

            <button
              onClick={() => handleAction("adjustPoints", openDropdown.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Award size={16} className="text-orange-400" />
              Adjust Points
            </button>

            <button
              onClick={() => {
                const garage = garages.find((g) => g._id === openDropdown.id);
                handleAction(
                  "toggleFeatured",
                  openDropdown.id,
                  !garage?.isFeatured
                );
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Star size={16} className="text-yellow-400" />
              {garages.find((g) => g._id === openDropdown.id)?.isFeatured
                ? "Remove Featured"
                : "Make Featured"}
            </button>

            <div className="h-px bg-white/5 my-1" />

            {garages.find((g) => g._id === openDropdown.id)?.status ===
              "pending" ||
            garages.find((g) => g._id === openDropdown.id)?.status ===
              "inactive" ? (
              <button
                onClick={() => handleAction("approve", openDropdown.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-green-400 hover:bg-green-500/10 transition-colors"
              >
                <ShieldCheck size={16} />
                Verify & Activate
              </button>
            ) : (
              <button
                onClick={() => handleAction("reject", openDropdown.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <ShieldAlert size={16} />
                Deactivate
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
