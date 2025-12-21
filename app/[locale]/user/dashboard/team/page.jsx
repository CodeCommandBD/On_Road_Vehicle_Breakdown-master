"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Settings,
  Activity,
  Crown,
  Shield,
  Eye,
  Mail,
  Trash2,
  ChevronDown,
} from "lucide-react";

export default function TeamManagementPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Fetch user and check access
  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    try {
      console.log("Fetching user data from API...");
      const res = await axios.get("/api/user/profile");
      const userData = res.data.data;

      console.log("User data received:", userData);
      setCurrentUser(userData);

      if (
        userData.membershipTier !== "enterprise" &&
        userData.membershipTier !== "premium"
      ) {
        console.log("Access denied - Not premium/enterprise user");
        router.push("/user/dashboard");
      } else {
        console.log("Access granted - Loading organizations");
        loadOrganizations();
      }
    } catch (error) {
      console.error("Failed to check user access:", error);
      router.push("/user/dashboard");
    }
  };

  // Load members and activities when org is selected
  useEffect(() => {
    if (selectedOrg) {
      loadMembers();
      loadActivities();
    }
  }, [selectedOrg]);

  const loadOrganizations = async () => {
    try {
      console.log("Loading organizations...");
      const res = await axios.get("/api/organizations");
      console.log("Organizations response:", res.data);
      setOrganizations(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setSelectedOrg(res.data.data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to load organizations:", error);
      setOrganizations([]);
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await axios.get(
        `/api/organizations/${selectedOrg.id}/members`
      );
      setMembers(res.data.data);
    } catch (error) {
      console.error("Failed to load members:", error);
    }
  };

  const loadActivities = async () => {
    try {
      const res = await axios.get(
        `/api/organizations/${selectedOrg.id}/activities?limit=20`
      );
      setActivities(res.data.data);
    } catch (error) {
      console.error("Failed to load activities:", error);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      await axios.post(`/api/organizations/${selectedOrg.id}/members`, {
        email: inviteEmail,
        role: inviteRole,
      });

      alert("Invitation sent successfully!");
      setInviteEmail("");
      setInviteRole("member");
      setShowInviteModal(false);
      loadMembers();
      loadActivities();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Are you sure you want to remove this member?")) {
      return;
    }

    try {
      await axios.delete(
        `/api/organizations/${selectedOrg.id}/members?userId=${userId}`
      );
      alert("Member removed successfully");
      loadMembers();
      loadActivities();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove member");
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      owner: {
        icon: Crown,
        color: "text-yellow-400 bg-yellow-400/10",
        label: "Owner",
      },
      admin: {
        icon: Shield,
        color: "text-purple-400 bg-purple-400/10",
        label: "Admin",
      },
      manager: {
        icon: Settings,
        color: "text-blue-400 bg-blue-400/10",
        label: "Manager",
      },
      member: {
        icon: Users,
        color: "text-green-400 bg-green-400/10",
        label: "Member",
      },
      viewer: {
        icon: Eye,
        color: "text-gray-400 bg-gray-400/10",
        label: "Viewer",
      },
    };

    const badge = badges[role] || badges.member;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${badge.color}`}
      >
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            No Organizations
          </h2>
          <p className="text-gray-400 mb-6">
            Create your first organization to start managing team members.
          </p>
          <button
            onClick={() => router.push("/user/dashboard/team/create")}
            className="btn-primary"
          >
            Create Organization
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Team Management</h1>
        <p className="text-gray-400">
          Manage your organization members and settings
        </p>
      </div>

      {/* Organization Selector (if multiple) */}
      {organizations.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Organization
          </label>
          <select
            value={selectedOrg?.id}
            onChange={(e) => {
              const org = organizations.find((o) => o.id === e.target.value);
              setSelectedOrg(org);
            }}
            className="w-full max-w-md px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.role})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members ({members.length})
              </h2>
              {selectedOrg?.role === "owner" ||
              selectedOrg?.role === "admin" ? (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Member
                </button>
              ) : null}
            </div>

            <div className="divide-y divide-gray-700/50">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-6 hover:bg-gray-700/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">
                            {member.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        {getRoleBadge(member.role)}
                        <span className="text-sm text-gray-500">
                          Joined{" "}
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {member.canManage && member.userId !== currentUser?._id && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="p-6 border-b border-gray-700/50">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </h2>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {activities.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  No recent activity
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50">
                  {activities.map((activity) => (
                    <div key={activity._id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <Activity className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-300">
                            <span className="font-medium text-white">
                              {activity.user?.name}
                            </span>{" "}
                            {activity.action.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Invite Team Member
            </h3>

            <form onSubmit={handleInviteMember}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="colleague@example.com"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Viewer - Read only access</option>
                  <option value="member">Member - Standard access</option>
                  <option value="manager">
                    Manager - Can manage operations
                  </option>
                  <option value="admin">Admin - Full access</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {inviteLoading ? "Sending..." : "Send Invitation"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
