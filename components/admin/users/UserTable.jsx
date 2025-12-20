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
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
    </div>
  );
}
