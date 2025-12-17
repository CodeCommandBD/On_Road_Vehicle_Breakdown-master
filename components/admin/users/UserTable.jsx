"use client";

import { useState } from "react";
import { MoreVertical, Search, Shield, Trash2, Eye } from "lucide-react";

// Mock data (replace with API later)
const initialUsers = [
  { id: 1, name: "Rahim Uddin", email: "rahim@example.com", role: "user", status: "Active", joinDate: "12 Dec 2024" },
  { id: 2, name: "Karim Garage", email: "karim@fixit.com", role: "garage", status: "Active", joinDate: "10 Dec 2024" },
  { id: 3, name: "Admin User", email: "admin@system.com", role: "admin", status: "Active", joinDate: "01 Dec 2024" },
  { id: 4, name: "Bad User", email: "bad@example.com", role: "user", status: "Banned", joinDate: "15 Dec 2024" },
];

export default function UserTable() {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((user) => user.id !== id));
    }
  };

  return (
    <div className="bg-[#1E1E1E] rounded-xl border border-white/5 overflow-hidden">
      {/* Table Header / Toolbar */}
      <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">All Users</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
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
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FF532D]/10 text-[#FF532D] flex items-center justify-center font-bold text-sm">
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{user.name}</div>
                      <div className="text-white/40 text-xs">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    user.role === 'admin' 
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                      : user.role === 'garage'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.status === 'Active' 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-white/60 text-sm">
                  {user.joinDate}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="View Details">
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
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
          <button disabled className="px-3 py-1 rounded bg-white/5 opacity-50 cursor-not-allowed">Previous</button>
          <button className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-white">Next</button>
        </div>
      </div>
    </div>
  );
}
