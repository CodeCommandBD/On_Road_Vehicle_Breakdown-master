"use client";

import { useEffect, useState } from "react";
import {
  MoreVertical,
  Search,
  Shield,
  Trash2,
  Eye,
  Award,
  Loader2,
  FileText,
  X,
} from "lucide-react";
import ImageUpload from "@/components/common/ImageUpload";
import axios from "axios";
import { toast } from "react-toastify";

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Contract Modal State
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [contractForm, setContractForm] = useState({
    documentUrl: "",
    startDate: "",
    endDate: "",
    status: "pending",
    customTerms: "",
  });

  const openContractModal = (user) => {
    setSelectedUser(user);
    if (user.contract) {
      setContractForm({
        documentUrl: user.contract.documentUrl || "",
        startDate: user.contract.startDate
          ? new Date(user.contract.startDate).toISOString().split("T")[0]
          : "",
        endDate: user.contract.endDate
          ? new Date(user.contract.endDate).toISOString().split("T")[0]
          : "",
        status: user.contract.status || "pending",
        customTerms: user.contract.customTerms || "",
      });
    } else {
      setContractForm({
        documentUrl: "",
        startDate: "",
        endDate: "",
        status: "pending",
        customTerms: "",
      });
    }
    setShowContractModal(true);
  };

  const handleContractSave = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSaving(true);

    try {
      const res = await axios.post("/api/admin/users/contract", {
        userId: selectedUser._id,
        ...contractForm,
      });

      if (res.data.success) {
        toast.success("Contract updated successfully");
        setShowContractModal(false);
        fetchUsers(); // Refresh list to show updated data if visualized
      }
    } catch (error) {
      console.error("Contract Save Error:", error);
      toast.error("Failed to save contract");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/admin/users");
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error("Fetch Users Error:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;
    try {
      const res = await axios.delete(`/api/admin/users?userId=${id}`);
      if (res.data.success) {
        toast.success("User deleted successfully");
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const handleAdjustPoints = async (userId, currentPoints) => {
    const newPointsString = prompt(
      `Enter new point balance for user:`,
      currentPoints
    );
    if (newPointsString === null) return;

    const newPoints = parseInt(newPointsString);
    if (isNaN(newPoints)) {
      toast.error("Please enter a valid number");
      return;
    }

    try {
      const res = await axios.put("/api/admin/users", {
        userId,
        rewardPoints: newPoints,
      });
      if (res.data.success) {
        toast.success(`Points updated to ${newPoints}`);
        fetchUsers();
      }
    } catch (err) {
      toast.error("Failed to update points");
    }
  };

  return (
    <div className="bg-[#1E1E1E] rounded-xl border border-white/5 overflow-hidden">
      {/* Table Header / Toolbar */}
      <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">All Users</h2>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            size={18}
          />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#FF532D]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 text-white/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Points</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map((user) => (
              <tr
                key={user._id}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FF532D]/10 text-[#FF532D] flex items-center justify-center font-bold text-sm">
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">
                        {user.name}
                      </div>
                      <div className="text-white/40 text-xs">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      user.role === "admin"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : user.role === "garage"
                        ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 font-bold text-orange-500">
                    <Award size={14} />
                    {user.rewardPoints || 0}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.isActive === false
                        ? "bg-red-500/10 text-red-400"
                        : "bg-green-500/10 text-green-400"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        user.isActive === false ? "bg-red-400" : "bg-green-400"
                      }`}
                    ></span>
                    {user.isActive === false ? "Banned" : "Active"}
                  </span>
                </td>
                <td className="px-6 py-4 text-white/60 text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() =>
                        handleAdjustPoints(user._id, user.rewardPoints)
                      }
                      className="p-2 text-white/40 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors"
                      title="Adjust Points"
                    >
                      <Award size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="p-2 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => openContractModal(user)}
                      className="p-2 text-white/40 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Manage Contract"
                    >
                      <FileText size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination (Static for now) */}
      <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
        <span>Showing 1-4 of 4 users</span>
        <div className="flex gap-2">
          <button
            disabled
            className="px-3 py-1 rounded bg-white/5 opacity-50 cursor-not-allowed"
          >
            Previous
          </button>
          <button className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-white">
            Next
          </button>
        </div>
      </div>
      {/* Contract Management Modal */}
      {showContractModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Manage Contract
              </h3>
              <button
                onClick={() => setShowContractModal(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleContractSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Contract PDF
                </label>
                <ImageUpload
                  value={contractForm.documentUrl}
                  onChange={(val) =>
                    setContractForm({
                      ...contractForm,
                      documentUrl: val,
                    })
                  }
                  placeholder="Upload Contract PDF"
                  accept=".pdf"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={contractForm.startDate}
                    onChange={(e) =>
                      setContractForm({
                        ...contractForm,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={contractForm.endDate}
                    onChange={(e) =>
                      setContractForm({
                        ...contractForm,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Status
                </label>
                <select
                  value={contractForm.status}
                  onChange={(e) =>
                    setContractForm({ ...contractForm, status: e.target.value })
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Custom Terms Summary
                </label>
                <textarea
                  rows="3"
                  value={contractForm.customTerms}
                  onChange={(e) =>
                    setContractForm({
                      ...contractForm,
                      customTerms: e.target.value,
                    })
                  }
                  placeholder="e.g. Net 30 payment terms, 20% discount on all services..."
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Contract"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
