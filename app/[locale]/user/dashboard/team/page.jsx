"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
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
  Search,
  Filter,
  RefreshCw,
  Palette,
  ExternalLink,
  Info,
  Save,
  X,
  Wallet,
  FileText,
  Lock,
} from "lucide-react";
import Link from "next/link";

export default function TeamManagementPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [activeTab, setActiveTab] = useState("members");
  const [brandingData, setBrandingData] = useState({
    name: "",
    logo: "",
    primaryColor: "#3B82F6",
  });
  const [brandingEditing, setBrandingEditing] = useState(false);

  // Member management states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [activities, setActivities] = useState([]);

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [resendingInvitation, setResendingInvitation] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(null);

  const router = useRouterWithLoading(); // Regular routing

  // ... (keep existing helper functions)

  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    try {
      const [profileRes, orgsRes] = await Promise.all([
        axios.get("/api/profile"),
        axios.get("/api/organizations"),
      ]);

      const userData = profileRes.data.user;
      const orgs = orgsRes.data.data || [];

      setCurrentUser(userData);
      setOrganizations(orgs);

      // Strict Enterprise & Premium Check
      const isEligiblePlan =
        userData.membershipTier === "enterprise" ||
        userData.membershipTier === "premium" ||
        userData.planTier === "enterprise" ||
        userData.planTier === "premium";

      // Use backend-computed flags for robust role checking
      const isOwner = userData.isEnterpriseOwner;
      const isTeamMember = userData.isTeamMember;

      // Access Check:
      // 1. Must have eligible plan (or be admin)
      // 2. If Team Member, must belong to an org

      // If NOT eligible plan AND NOT a team member AND NOT Global Admin -> Deny
      if (!isEligiblePlan && !isTeamMember && userData.role !== "admin") {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      if (isTeamMember && (!orgs || orgs.length === 0)) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);

      if (orgs.length > 0) {
        const firstOrg = orgs[0];
        setSelectedOrg(firstOrg);
        setBrandingData({
          name: firstOrg.name || "",
          logo: firstOrg.settings?.branding?.logo || "",
          primaryColor: firstOrg.settings?.branding?.primaryColor || "#3B82F6",
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to check user access:", error);
      router.push("/user/dashboard");
    }
  };

  // Load members and activities when org is selected
  useEffect(() => {
    if (selectedOrg) {
      loadMembers();
      loadInvitations();
      loadActivities();
    }
  }, [selectedOrg]);

  const loadOrganizations = async () => {
    try {
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

  const loadInvitations = async () => {
    try {
      const res = await axios.get(
        `/api/organizations/${selectedOrg.id}/invitations`
      );
      setInvitations(res.data.data);
    } catch (error) {
      console.error("Failed to load invitations:", error);
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
    setInviteError("");

    try {
      await axios.post(`/api/organizations/${selectedOrg.id}/members`, {
        email: inviteEmail,
        role: inviteRole,
      });

      toast.success("Invitation sent successfully!");
      setInviteEmail("");
      setInviteRole("member");
      setShowInviteModal(false);
      loadMembers();
      loadInvitations();
      loadActivities();
    } catch (error) {
      console.error("Invite Error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to send invitation";
      setInviteError(errorMessage);
      toast.error(errorMessage);
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
      toast.success("Member removed successfully");
      loadMembers();
      loadActivities();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setUpdatingRole(userId);
    try {
      await axios.patch(`/api/organizations/${selectedOrg.id}/members`, {
        userId,
        role: newRole,
      });
      toast.success("Member role updated");
      loadMembers();
      loadActivities();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    setResendingInvitation(invitationId);
    try {
      await axios.patch(`/api/organizations/${selectedOrg.id}/invitations`, {
        invitationId,
      });
      toast.success("Invitation resent successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to resend invitation"
      );
    } finally {
      setResendingInvitation(null);
    }
  };

  const handleSaveBranding = async () => {
    setBrandingEditing(true);
    try {
      await axios.patch(`/api/organizations/${selectedOrg.id}`, {
        name: brandingData.name,
        settings: {
          branding: {
            logo: brandingData.logo,
            primaryColor: brandingData.primaryColor,
          },
        },
      });
      toast.success("Branding settings saved");
      // Refresh org data
      const res = await axios.get(`/api/organizations/${selectedOrg.id}`);
      const updatedOrg = res.data.data;
      setSelectedOrg(updatedOrg);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o))
      );
    } catch (error) {
      toast.error("Failed to save branding");
    } finally {
      setBrandingEditing(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole && member.role !== "owner"; // Exclude owner from general list
  });

  const ownerMember = members.find((m) => m.role === "owner");

  const getMemberLimit = (tier) => {
    const limits = {
      enterprise: 9999,
      premium: 50,
      standard: 20,
      trial: 10,
      basic: 10,
      free: 5,
    };
    return limits[tier.toLowerCase()] || 5;
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

  const MemberDetailsModal = ({ member, onClose }) => {
    if (!member) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header Background */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/60 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative pt-16 px-8 pb-8">
            {/* Avatar & Info */}
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] shadow-xl mb-4">
                <div className="w-full h-full rounded-full bg-[#1E1E1E] flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {member.name}
              </h2>
              <p className="text-white/60 mb-2">{member.email}</p>
              <div className="mb-6">{getRoleBadge(member.role)}</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-2">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {member.sosCount}
                </div>
                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                  SOS Alerts
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {member.totalRequests || 0}
                </div>
                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                  Requests
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-2">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-white">
                  ৳{member.totalSpend?.toLocaleString() || 0}
                </div>
                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                  Total Spend
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-white/40 text-sm">
                  Joined Organization
                </span>
                <span className="text-white/80 text-sm font-medium">
                  {new Date(member.joinedAt).toLocaleDateString(undefined, {
                    dateStyle: "long",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-white/40 text-sm">Invited By</span>
                <span className="text-white/80 text-sm font-medium">
                  {member.invitedBy || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-white/40 text-sm">Last Active</span>
                <span className="text-white/80 text-sm font-medium">
                  {member.lastActiveAt
                    ? new Date(member.lastActiveAt).toLocaleString()
                    : "Recently"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
    // Check if user is Enterprise Owner (can create)
    const isEnterpriseOwner =
      currentUser?.isEnterpriseOwner ||
      (currentUser?.membershipTier === "enterprise" &&
        !currentUser?.isTeamMember);

    // Check if user is Enterprise Member (view only)
    const isEnterpriseMember = currentUser?.isTeamMember;

    // Normal user (needs upgrade)
    const isNormalUser = !isEnterpriseOwner && !isEnterpriseMember;

    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            No Organizations
          </h2>

          {/* Enterprise Owner - Can Create */}
          {isEnterpriseOwner && (
            <>
              <p className="text-gray-400 mb-6">
                Create your first organization to start managing team members.
              </p>
              <button
                onClick={() => router.push("/user/dashboard/team/create")}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Create Organization
              </button>
            </>
          )}

          {/* Enterprise Member - View Only */}
          {isEnterpriseMember && (
            <>
              <p className="text-gray-400 mb-4">
                You don't have access to any organizations yet.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mt-6">
                <Lock className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                <p className="text-yellow-500 font-semibold mb-2">
                  Member Access Only
                </p>
                <p className="text-sm text-gray-400">
                  As an Enterprise member, you can view organizations you're
                  invited to, but only the organization owner can create new
                  organizations.
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  Contact your organization owner to get invited.
                </p>
              </div>
            </>
          )}

          {/* Normal User - Upgrade Required */}
          {isNormalUser && (
            <>
              <p className="text-gray-400 mb-4">
                Team Management is available on Premium and Enterprise plans.
              </p>
              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-8 mt-6">
                <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Unlock Team Management
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Collaborate with your team, assign roles, and track activity
                  in real-time.
                  <br />
                  Manage your organization efficiently with advanced
                  permissions.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6 text-left">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Premium Plan</p>
                    <p className="text-white font-bold">Up to 50 members</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">
                      Enterprise Plan
                    </p>
                    <p className="text-white font-bold">Unlimited members</p>
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all transform hover:scale-105"
                >
                  View Pricing & Upgrade
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // --- LOCK SCREEN ---
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-8 max-w-2xl w-full text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-orange-500/20 blur-[50px] rounded-full pointer-events-none" />

          <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
            <Lock className="w-8 h-8 text-orange-500" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 relative z-10">
            Team Management
          </h2>
          <p className="text-white/60 mb-8 relative z-10 leading-relaxed">
            Collaborate with your team, assign roles, and track activity in
            real-time.
            <br />
            Manage your organization efficiently with advanced permissions and
            audit logs.
            <br />
            <span className="block mt-4 text-orange-400 font-semibold">
              Available exclusively on **Premium** and **Enterprise** plans.
            </span>
          </p>

          <Link
            href="/pricing"
            className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all relative z-10 transform hover:scale-105"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    );
  }

  const isOrgAdmin =
    selectedOrg?.role === "owner" || selectedOrg?.role === "admin";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Team Management
          </h1>
          <p className="text-gray-400">
            Manage your organization members and settings
          </p>
        </div>

        <div className="flex bg-gray-800/50 p-1 rounded-xl border border-gray-700/50 w-fit">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "members"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Members
            </div>
          </button>

          {isOrgAdmin && (
            <button
              onClick={() => setActiveTab("branding")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "branding"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Branding
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Organization Selector (if multiple) */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1 max-w-md">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
            Current Organization
          </label>
          <div className="relative">
            <select
              value={selectedOrg?.id}
              onChange={(e) => {
                const org = organizations.find((o) => o.id === e.target.value);
                setSelectedOrg(org);
                setBrandingData({
                  name: org.name || "",
                  logo: org.settings?.branding?.logo || "",
                  primaryColor:
                    org.settings?.branding?.primaryColor || "#3B82F6",
                });
              }}
              className="w-full appearance-none px-4 py-3 bg-gray-800 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-10"
            >
              {organizations.map((org) => (
                <option
                  key={org.id}
                  value={org.id}
                  className="bg-[#1A1A1A] text-white"
                >
                  {org.name} ({org.role})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Member Limit Tracker */}
        <div className="flex-1 bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Team Capacity
            </span>
            <span className="text-xs text-blue-400 font-bold">
              {members.length} / {getMemberLimit(currentUser?.membershipTier)}
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                members.length / getMemberLimit(currentUser?.membershipTier) >
                0.9
                  ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
              }`}
              style={{
                width: `${Math.min(
                  (members.length /
                    getMemberLimit(currentUser?.membershipTier)) *
                    100,
                  100
                )}%`,
              }}
            ></div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Plan: {currentUser?.membershipTier?.toUpperCase()} Tier
          </p>
        </div>
      </div>

      {activeTab === "members" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members List */}
          <div className={isOrgAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
            {/* Organization Owner Section (Separated from list) */}
            {isOrgAdmin && ownerMember && (
              <div className="mb-8 p-[1px] rounded-2xl bg-gradient-to-br from-yellow-500/50 via-gray-700/50 to-transparent">
                <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-yellow-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Crown className="w-3 h-3" />
                      Organization Owner
                    </h2>
                    <div className="px-3 py-1 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
                        Total Control
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                          {ownerMember.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-gray-900 rounded-lg border border-yellow-500/50 flex items-center justify-center shadow-lg">
                          <Crown className="w-4 h-4 text-yellow-500" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-white">
                            {ownerMember.name}
                          </h3>
                          {ownerMember.userId === currentUser?._id && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-blue-500/30">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 font-medium">
                          {ownerMember.email}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-gray-500 font-bold uppercase">
                            Joined{" "}
                            {new Date(
                              ownerMember.joinedAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="flex-1 sm:flex-none flex flex-col items-center px-4 py-2 bg-yellow-500/5 rounded-xl border border-yellow-500/10">
                        <span className="text-[10px] text-yellow-500/50 font-bold uppercase tracking-tight">
                          SOS Activity
                        </span>
                        <span className="text-lg font-bold text-yellow-500">
                          {ownerMember.sosCount}{" "}
                          <span className="text-xs font-normal opacity-70">
                            alerts
                          </span>
                        </span>
                      </div>

                      <div
                        className="p-2 bg-gray-800/50 rounded-xl border border-gray-700/50 text-gray-400 hover:text-white transition-colors cursor-help"
                        title="Organization owners have full management rights"
                      >
                        <Shield className="w-5 h-5 text-yellow-500/80" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Search and Filters */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800/40 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              {isOrgAdmin && (
                <div className="relative sm:w-48">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800/40 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none appearance-none"
                  >
                    <option value="all" className="bg-[#1A1A1A] text-white">
                      All Roles
                    </option>
                    <option value="owner" className="bg-[#1A1A1A] text-white">
                      Owners
                    </option>
                    <option value="admin" className="bg-[#1A1A1A] text-white">
                      Admins
                    </option>
                    <option value="manager" className="bg-[#1A1A1A] text-white">
                      Managers
                    </option>
                    <option value="member" className="bg-[#1A1A1A] text-white">
                      Members
                    </option>
                    <option value="viewer" className="bg-[#1A1A1A] text-white">
                      Viewers
                    </option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
                </div>
              )}
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members ({filteredMembers.length})
                </h2>
                {(selectedOrg?.role === "owner" ||
                  selectedOrg?.role === "admin") && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite Member
                  </button>
                )}
              </div>

              <div className="divide-y divide-gray-700/50">
                {filteredMembers.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    No members match your search criteria.
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className="p-6 hover:bg-white/5 transition-all cursor-pointer group border-b border-gray-700/50 last:border-0"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] shadow-lg group-hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-full bg-[#1A1A1A] flex items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                {member.name}
                              </h3>
                              {member.userId === currentUser?._id && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-blue-500/30">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">
                              {member.email}
                            </p>
                          </div>
                        </div>

                        <div
                          className="flex flex-wrap items-center gap-4 w-full sm:w-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Role Manager Badge */}
                          {member.canManage &&
                          selectedOrg?.role === "owner" &&
                          member.userId !== currentUser?._id ? (
                            <div className="relative">
                              <select
                                disabled={updatingRole === member.userId}
                                value={member.role}
                                onChange={(e) =>
                                  handleUpdateRole(
                                    member.userId,
                                    e.target.value
                                  )
                                }
                                className="appearance-none bg-black/40 hover:bg-black/60 text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/10 pr-10 focus:outline-none focus:border-blue-500 transition-all uppercase tracking-wide cursor-pointer shadow-sm"
                              >
                                <option value="admin" className="bg-[#1A1A1A]">
                                  Admin
                                </option>
                                <option
                                  value="manager"
                                  className="bg-[#1A1A1A]"
                                >
                                  Manager
                                </option>
                                <option value="member" className="bg-[#1A1A1A]">
                                  Member
                                </option>
                                <option value="viewer" className="bg-[#1A1A1A]">
                                  Viewer
                                </option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                              {updatingRole === member.userId && (
                                <RefreshCw className="absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                              )}
                            </div>
                          ) : (
                            getRoleBadge(member.role)
                          )}

                          {/* Mini Stats (Quick View) */}
                          <div className="flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                            <div
                              className="flex items-center gap-1.5"
                              title="Total Spend"
                            >
                              <Wallet className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-xs font-bold text-white">
                                ৳
                                {member.totalSpend
                                  ? (member.totalSpend / 1000).toFixed(1) + "k"
                                  : "0"}
                              </span>
                            </div>
                            <div className="w-[1px] h-3 bg-white/10"></div>
                            <div
                              className="flex items-center gap-1.5"
                              title="SOS Alerts"
                            >
                              <Activity className="w-3.5 h-3.5 text-red-400" />
                              <span className="text-xs font-bold text-white">
                                {member.sosCount}
                              </span>
                            </div>
                          </div>

                          {member.canManage && (
                            <button
                              onClick={() => handleRemoveMember(member.userId)}
                              disabled={member.userId === currentUser?._id}
                              className={`p-2 rounded-lg transition-colors ${
                                member.userId === currentUser?._id
                                  ? "opacity-20 cursor-not-allowed"
                                  : "text-white/40 hover:text-red-400 hover:bg-red-500/10"
                              }`}
                              title="Remove member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Invitations Section */}
            {invitations.length > 0 && (
              <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
                <div className="p-6 border-b border-gray-700/50">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    Pending Invitations ({invitations.length})
                  </h2>
                </div>

                <div className="divide-y divide-gray-700/50">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-6 hover:bg-gray-700/10 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-700/40 flex items-center justify-center text-gray-500">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">
                              {inv.email}
                            </h3>
                            <p className="text-xs text-gray-500">
                              Invited by {inv.invitedBy} &bull;{" "}
                              {new Date(inv.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          {getRoleBadge(inv.role)}
                          <div className="flex items-center gap-2">
                            <button
                              disabled={resendingInvitation === inv.id}
                              onClick={() => handleResendInvitation(inv.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all disabled:opacity-50"
                            >
                              {resendingInvitation === inv.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                              RESEND
                            </button>
                            {/* Invitation Link for manual copy */}
                            <button
                              onClick={() => {
                                // Potentially copy a link if available or just toast
                                toast.info("Invitation link sent to email");
                              }}
                              className="p-2 text-gray-500 hover:text-white"
                              title="Email sent"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          {isOrgAdmin && (
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden sticky top-6">
                <div className="p-6 border-b border-gray-700/50">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Recent Activity
                  </h2>
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                  {activities.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No recent activity
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700/50">
                      {activities.map((activity) => (
                        <div
                          key={activity._id}
                          className="p-4 hover:bg-gray-700/10 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                              <Activity className="w-3 h-3 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-300">
                                <span className="font-bold text-white">
                                  {activity.user?.name || "System"}
                                </span>{" "}
                                <span className="text-gray-400">
                                  {activity.action.replace(/_/g, " ")}
                                </span>
                              </p>
                              <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tight">
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
          )}
        </div>
      ) : (
        // --- BRANDING TAB ---
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-700/50">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Palette className="w-6 h-6 text-blue-500" />
                Organization Branding
              </h2>
              <p className="text-gray-400 mt-1">
                Customize how your organization appears to your team members
              </p>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 uppercase tracking-widest mb-2 px-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={brandingData.name}
                    onChange={(e) =>
                      setBrandingData({ ...brandingData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Enter Org Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 uppercase tracking-widest mb-2 px-1">
                    Logo URL
                  </label>
                  <input
                    type="text"
                    value={brandingData.logo}
                    onChange={(e) =>
                      setBrandingData({ ...brandingData, logo: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-xs"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 uppercase tracking-widest mb-2 px-1">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={brandingData.primaryColor}
                      onChange={(e) =>
                        setBrandingData({
                          ...brandingData,
                          primaryColor: e.target.value,
                        })
                      }
                      className="w-12 h-12 rounded-lg bg-gray-900 border border-gray-700 cursor-pointer overflow-hidden p-0"
                    />
                    <input
                      type="text"
                      value={brandingData.primaryColor}
                      onChange={(e) =>
                        setBrandingData({
                          ...brandingData,
                          primaryColor: e.target.value,
                        })
                      }
                      className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <label className="block text-sm font-bold text-gray-300 uppercase tracking-widest mb-2 px-1">
                  Preview
                </label>
                <div className="p-6 bg-gray-900/80 rounded-2xl border border-gray-700/50 shadow-inner">
                  <div className="flex items-center gap-3 mb-6">
                    {brandingData.logo ? (
                      <img
                        src={brandingData.logo}
                        alt="Logo"
                        className="w-10 h-10 rounded-lg object-contain"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                        style={{ backgroundColor: brandingData.primaryColor }}
                      >
                        {brandingData.name.charAt(0) || "O"}
                      </div>
                    )}
                    <span className="text-xl font-bold text-white">
                      {brandingData.name || "Organization Name"}
                    </span>
                  </div>

                  <div
                    className="h-2 rounded-full mb-4 opacity-50"
                    style={{ backgroundColor: brandingData.primaryColor }}
                  ></div>
                  <div
                    className="btn-primary w-full text-center py-3 rounded-xl font-bold transition-all shadow-lg"
                    style={{
                      backgroundColor: brandingData.primaryColor,
                      borderColor: brandingData.primaryColor,
                    }}
                  >
                    Button Preview
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-black/20 border-t border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500 max-w-sm">
                * Note: Your organization's branding will be applied to team
                dashboards and internal communications.
              </p>
              <button
                disabled={brandingEditing}
                onClick={handleSaveBranding}
                className="btn-primary px-10 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-blue-500/10 min-w-[150px] justify-center"
              >
                {brandingEditing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    SAVING...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    SAVE CHANGES
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Invite Team Member
            </h3>

            {inviteError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 flex-shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {inviteError}
              </div>
            )}

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

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
