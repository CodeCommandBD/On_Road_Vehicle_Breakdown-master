"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  User,
  Phone,
  Mail,
  Trash2,
  Loader2,
  Shield,
  Wrench,
  CheckCircle,
  XCircle,
  Key,
  Edit2,
  Wrench,
  Star,
  Award,
} from "lucide-react";
import { toast } from "react-toastify";

export default function TeamManagementPage() {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Form State
  const [newUser, setNewUser] = useState({
    name: "",
    phone: "",
    email: "", // Optional
    password: "",
    skills: "", // Comma separated
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/garage/team");
      const data = await res.json();
      if (data.success) {
        setTeam(data.teamMembers);
      }
    } catch (error) {
      console.error("Failed to fetch team:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMechanic = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const skillsArray = newUser.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);

      const res = await fetch("/api/garage/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newUser,
          skills: skillsArray,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Mechanic added successfully! 🎉");
        setShowAddModal(false);
        setNewUser({
          name: "",
          phone: "",
          email: "",
          password: "",
          skills: "",
        });
        fetchTeam(); // Refresh list
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to add mechanic");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/garage/team/${memberToDelete._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Mechanic removed successfully");
        setShowDeleteModal(false);
        setMemberToDelete(null);
        fetchTeam();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to remove mechanic");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const skillsArray =
        typeof editingMember.skills === "string"
          ? editingMember.skills
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s)
          : editingMember.skills;

      const res = await fetch(`/api/garage/team/${editingMember._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingMember,
          skills: skillsArray,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Mechanic updated successfully!");
        setShowEditModal(false);
        fetchTeam();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to update mechanic");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500 mt-1">
            Manage your mechanics and staff access
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
        >
          <Plus className="w-5 h-5" /> Add New Mechanic
        </button>
      </div>

      {/* Team List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : team.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            No Team Members Yet
          </h3>
          <p className="text-gray-500 mt-2 mb-6">
            Start building your dream team by adding mechanics.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-primary font-bold hover:underline"
          >
            Add your first member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member) => (
            <div
              key={member._id}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-primary font-bold text-xl uppercase">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{member.name}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold bg-gray-100 px-2 py-0.5 rounded-lg inline-block mt-1">
                      {member.role}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                      member.user?.availability?.status === "online"
                        ? "bg-green-100 text-green-600"
                        : member.user?.availability?.status === "busy"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {member.user?.availability?.status || "offline"}
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      member.user?.availability?.status === "online"
                        ? "bg-green-500"
                        : member.user?.availability?.status === "busy"
                        ? "bg-orange-500"
                        : "bg-gray-300"
                    } ring-4 ring-gray-50`}
                  />
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {member.phone}
                </div>
                {member.initialPassword && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl overflow-hidden mt-1">
                    <Key className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-mono bg-white px-2 rounded border border-gray-200">
                      {member.initialPassword}
                    </span>
                  </div>
                )}
                {member.user?.mechanicProfile?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {member.user.mechanicProfile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="text-xs bg-orange-50 text-primary px-3 py-1 rounded-full border border-orange-100 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Performance Stats Bar */}
              <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center text-primary mb-1">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {member.user?.mechanicProfile?.completedJobs || 0}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase font-medium">
                    Jobs
                  </div>
                </div>
                <div className="text-center border-x border-gray-200">
                  <div className="flex items-center justify-center text-yellow-500 mb-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-500" />
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {member.user?.mechanicProfile?.rating?.average || 0}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase font-medium">
                    Rating
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-blue-500 mb-1">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {member.user?.rewardPoints || 0}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase font-medium">
                    Points
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-500">
                  Added: {new Date(member.addedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingMember({
                        ...member,
                        skills:
                          member.user?.mechanicProfile?.skills?.join(", ") ||
                          "",
                      });
                      setShowEditModal(true);
                    }}
                    className="text-primary hover:bg-orange-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setMemberToDelete(member);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add New Mechanic</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAddMechanic} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. Rahim Miah"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-gray-900 placeholder:text-gray-400"
                    placeholder="01XXXXXXXXX"
                    value={newUser.phone}
                    onChange={(e) =>
                      setNewUser({ ...newUser, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-gray-900 placeholder:text-gray-400"
                    placeholder="Set a password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (Optional)
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. Engine, AC repair, Bike Specialist"
                  value={newUser.skills}
                  onChange={(e) =>
                    setNewUser({ ...newUser, skills: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate skills with commas
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Edit Mechanic</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. Rahim Miah"
                  value={editingMember.name}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-gray-900 placeholder:text-gray-400"
                  placeholder="01XXXXXXXXX"
                  value={editingMember.phone}
                  onChange={(e) =>
                    setEditingMember({
                      ...editingMember,
                      phone: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (Optional)
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. Engine, AC repair, Bike Specialist"
                  value={editingMember.skills}
                  onChange={(e) =>
                    setEditingMember({
                      ...editingMember,
                      skills: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate skills with commas
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Are you sure?
            </h2>
            <p className="text-gray-500 mb-8">
              You are about to remove{" "}
              <span className="font-bold text-gray-900">
                {memberToDelete.name}
              </span>
              . This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
