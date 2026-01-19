"use client";

import {
  MoreVertical,
  Search,
  Shield,
  Trash2,
  Eye,
  Award,
  Wrench,
  FileText,
  X,
} from "lucide-react";
import ImageUpload from "@/components/common/ImageUpload";
import UserDetailsModal from "./UserDetailsModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { toast } from "react-toastify";

export default function UserTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openDropdown, setOpenDropdown] = useState(null);

  // Contract Modal State
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [contractForm, setContractForm] = useState({
    documentUrl: "",
    startDate: "",
    endDate: "",
    status: "pending",
    customTerms: "",
  });

  // Fetch Users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const response = await axiosInstance.get("/admin/users");
      return response.data.data || [];
    },
  });

  const users = usersData || [];

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosInstance.delete(`/admin/users?userId=${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Delete failed");
    },
  });

  const adjustPointsMutation = useMutation({
    mutationFn: async ({ userId, rewardPoints }) => {
      const res = await axiosInstance.put("/admin/users", {
        userId,
        rewardPoints,
      });
      return res.data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Points updated to ${variables.rewardPoints}`);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: () => {
      toast.error("Failed to update points");
    },
  });

  const saveContractMutation = useMutation({
    mutationFn: async (contractData) => {
      const res = await axiosInstance.post(
        "/admin/users/contract",
        contractData,
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Contract updated successfully");
      setShowContractModal(false);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: () => {
      toast.error("Failed to save contract");
    },
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
    saveContractMutation.mutate({
      userId: selectedUser._id,
      ...contractForm,
    });
  };

  const isSaving = saveContractMutation.isPending;

  const filteredUsers = (users || []).filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive !== false) ||
      (statusFilter === "banned" && user.isActive === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    )
      return;
    deleteMutation.mutate(id);
  };

  const handleAdjustPoints = async (userId, currentPoints) => {
    const newPointsString = prompt(
      `Enter new point balance for user:`,
      currentPoints,
    );
    if (newPointsString === null) return;

    const newPoints = parseInt(newPointsString);
    if (isNaN(newPoints)) {
      toast.error("Please enter a valid number");
      return;
    }
    adjustPointsMutation.mutate({ userId, rewardPoints: newPoints });
  };

  const getUserActions = (user) => {
    const actions = [
      {
        label: "View Details",
        icon: Eye,
        color: "text-white/80",
        onClick: () => {
          setSelectedUser(user);
          setShowDetailsModal(true);
        },
      },
      {
        label: "Adjust Points",
        icon: Award,
        color: "text-orange-400",
        onClick: () => handleAdjustPoints(user._id, user.rewardPoints),
        separator: true,
      },
      {
        label: "Manage Contract",
        icon: FileText,
        color: "text-blue-400",
        onClick: () => openContractModal(user),
        separator: true,
      },
      {
        label: "Delete User",
        icon: Trash2,
        color: "text-red-400",
        onClick: () => handleDelete(user._id),
        separator: true,
      },
    ];
    return actions;
  };

  return (
    <div className="bg-[#1E1E1E] rounded-xl border border-white/5 overflow-hidden">
      {/* Table Header / Toolbar */}
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">All Users</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              size={18}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF532D]"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF532D] min-w-[140px]"
          >
            <option value="all" className="bg-[#1A1A1A] text-white">
              All Roles
            </option>
            <option value="user" className="bg-[#1A1A1A] text-white">
              User
            </option>
            <option value="garage" className="bg-[#1A1A1A] text-white">
              Garage
            </option>
            <option value="mechanic" className="bg-[#1A1A1A] text-white">
              Mechanic
            </option>
            <option value="admin" className="bg-[#1A1A1A] text-white">
              Admin
            </option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF532D] min-w-[140px]"
          >
            <option value="all" className="bg-[#1A1A1A] text-white">
              All Status
            </option>
            <option value="active" className="bg-[#1A1A1A] text-white">
              Active
            </option>
            <option value="banned" className="bg-[#1A1A1A] text-white">
              Banned
            </option>
          </select>
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
              {roleFilter === "mechanic" && (
                <>
                  <th className="px-6 py-4">Garage</th>
                  <th className="px-6 py-4">Performance</th>
                </>
              )}
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
                          : user.role === "mechanic"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
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
                {roleFilter === "mechanic" && (
                  <>
                    <td className="px-6 py-4">
                      <div className="text-white/80 text-sm font-medium">
                        {user.garageId?.name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-yellow-400 flex items-center gap-1">
                          <span className="font-bold">
                            {user.mechanicProfile?.rating?.average?.toFixed(
                              1,
                            ) || "0.0"}
                          </span>
                          <span className="text-white/40 text-xs">
                            ({user.mechanicProfile?.completedJobs || 0} Jobs)
                          </span>
                        </div>
                      </div>
                    </td>
                  </>
                )}
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
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setOpenDropdown(
                          openDropdown === user._id
                            ? null
                            : {
                                id: user._id,
                                x: rect.right - 180,
                                y: rect.bottom + 5,
                              },
                        );
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical size={18} className="text-white" />
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdown?.id === user._id && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenDropdown(null)}
                        ></div>

                        {/* Dropdown Content */}
                        <div
                          className="fixed z-50 bg-[#1A1A1A] border border-white/20 rounded-xl shadow-2xl min-w-[180px] overflow-hidden"
                          style={{
                            left: `${openDropdown.x}px`,
                            top: `${openDropdown.y}px`,
                          }}
                        >
                          {getUserActions(user).map((action, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                action.onClick();
                                setOpenDropdown(null);
                              }}
                              className={`w-full px-4 py-3 text-left ${
                                action.color
                              } hover:bg-white/10 transition-colors flex items-center gap-2 text-sm ${
                                action.separator
                                  ? "border-t border-white/10"
                                  : ""
                              }`}
                            >
                              <action.icon size={16} />
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
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
                  <option value="pending" className="bg-[#1A1A1A] text-white">
                    Pending
                  </option>
                  <option value="active" className="bg-[#1A1A1A] text-white">
                    Active
                  </option>
                  <option value="expired" className="bg-[#1A1A1A] text-white">
                    Expired
                  </option>
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
                    <Wrench className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Contract"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
}
