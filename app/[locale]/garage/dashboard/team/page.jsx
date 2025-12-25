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
} from "lucide-react";
import { toast } from "react-toastify";

export default function TeamManagementPage() {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

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
                <div
                  className={`w-3 h-3 rounded-full ${
                    member.isActive ? "bg-green-500" : "bg-red-500"
                  } ring-4 ring-gray-50`}
                />
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {member.phone}
                </div>
                {member.email && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl overflow-hidden">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-500">
                  Added: {new Date(member.addedAt).toLocaleDateString()}
                </span>
                <button className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
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
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
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
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
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
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
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
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
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
    </div>
  );
}
