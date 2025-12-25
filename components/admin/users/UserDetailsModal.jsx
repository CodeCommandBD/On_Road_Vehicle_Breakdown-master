import {
  X,
  User,
  MapPin,
  Phone,
  Mail,
  Car,
  Wrench,
  Shield,
  Calendar,
  Star,
} from "lucide-react";

export default function UserDetailsModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-start sticky top-0 bg-[#1E1E1E] z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-white/40" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
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
                <span className="text-white/40 text-sm">•</span>
                <span className="text-white/60 text-sm capitalize">
                  {user.membershipTier} Member
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-white/40 text-xs font-bold uppercase tracking-wider">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/80">
                  <Mail size={16} className="text-white/40" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Phone size={16} className="text-white/40" />
                  <span>{user.phone || "N/A"}</span>
                </div>
                <div className="flex items-start gap-3 text-white/80">
                  <MapPin size={16} className="text-white/40 mt-1" />
                  <span>
                    {[
                      user.address?.street,
                      user.address?.city,
                      user.address?.district,
                      user.address?.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "No address provided"}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Stats */}
            <div className="space-y-4">
              <h3 className="text-white/40 text-xs font-bold uppercase tracking-wider">
                Account Status
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="text-white/40 text-xs mb-1">
                    Reward Points
                  </div>
                  <div className="text-xl font-bold text-[#FF532D]">
                    {user.rewardPoints || 0}
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="text-white/40 text-xs mb-1">Status</div>
                  <div
                    className={`font-medium ${
                      user.isActive === false
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {user.isActive === false ? "Banned" : "Active"}
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5 col-span-2">
                  <div className="text-white/40 text-xs mb-1">Joined Date</div>
                  <div className="flex items-center gap-2 text-white">
                    <Calendar size={14} />
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mechanic Specifics */}
          {user.role === "mechanic" && (
            <div className="space-y-4">
              <h3 className="text-white/40 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Wrench size={16} />
                Mechanic Profile
              </h3>
              <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-white/60">Rating & Jobs</div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star size={16} fill="currentColor" />
                    <span className="font-bold">
                      {user.mechanicProfile?.rating?.average?.toFixed(1) ||
                        "0.0"}
                    </span>
                    <span className="text-white/40 text-xs">
                      ({user.mechanicProfile?.rating?.count || 0} reviews)
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-white/40 text-xs mb-1">Total Jobs</div>
                    <div className="text-white font-medium">
                      {user.mechanicProfile?.completedJobs || 0} Completed
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs mb-1">Garage</div>
                    <div className="text-white font-medium">
                      {user.garageId?.name || "Not Assigned"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vehicles List */}
          {user.vehicles && user.vehicles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-white/40 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Car size={16} />
                Registered Vehicles
              </h3>
              <div className="grid gap-3">
                {user.vehicles.map((vehicle, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5"
                  >
                    <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                      <Car size={20} className="text-white/60" />
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-sm text-white/40 flex items-center gap-2">
                        <span className="bg-white/10 px-1.5 rounded text-xs text-white/60">
                          {vehicle.licensePlate}
                        </span>
                        <span>•</span>
                        <span>{vehicle.year}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
