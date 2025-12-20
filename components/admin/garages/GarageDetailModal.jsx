"use client";

import {
  X,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Star,
  FileText,
  Award,
  User,
  Wrench,
  ImageIcon,
  ExternalLink,
} from "lucide-react";

export default function GarageDetailModal({ garage, onClose, onAction }) {
  if (!garage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1E1E1E] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {garage.name}
              {garage.isVerified && (
                <ShieldCheck className="text-blue-500" size={20} />
              )}
            </h2>
            <p className="text-white/60 text-sm mt-1">
              Status: <span className="capitalize">{garage.status}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Work Info / Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-white/80 font-semibold border-b border-white/5 pb-2">
                Contact Info
              </h3>
              <div className="space-y-3 text-sm text-white/70">
                <div className="flex items-center gap-3">
                  <Phone size={16} /> {garage.phone}
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} /> {garage.email}
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} /> {garage.address?.street},{" "}
                  {garage.address?.city}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-white/80 font-semibold border-b border-white/5 pb-2">
                Business Details
              </h3>
              <div className="space-y-3 text-sm text-white/70">
                <div className="flex justify-between">
                  <span>License No:</span>
                  <span className="text-white">
                    {garage.verification?.tradeLicense?.number || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Owner:</span>
                  <span className="text-white">{garage.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rating:</span>
                  <span className="text-yellow-500 flex items-center gap-1">
                    <Star size={14} fill="currentColor" /> {garage.rating || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours Placeholder - Since detailed hours usually require deeper population */}
          <div>
            <h3 className="text-white/80 font-semibold border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
              <Clock size={18} /> Operating info
            </h3>
            <p className="text-xs text-white/40 italic">
              Detailed operating hours can be found in the garage's profile
              submission.
            </p>
          </div>

          {/* Services Offered */}
          <div>
            <h3 className="text-white/80 font-semibold border-b border-white/5 pb-2 mb-4">
              Services Offered
            </h3>
          </div>

          {/* Legal Documents */}
          <div className="space-y-4">
            <h3 className="text-white/80 font-semibold border-b border-white/5 pb-2 flex items-center gap-2">
              <FileText size={18} /> Legal Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {garage.verification?.tradeLicense?.imageUrl && (
                <a
                  href={garage.verification.tradeLicense.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-orange-500/50 transition-all group"
                >
                  <p className="text-[10px] text-white/40 uppercase font-bold mb-2">
                    Trade License
                  </p>
                  <div className="flex items-center justify-between text-white text-sm">
                    <span>View Document</span>
                    <ExternalLink
                      size={14}
                      className="group-hover:text-orange-500"
                    />
                  </div>
                </a>
              )}
              {garage.verification?.nid?.imageUrl && (
                <a
                  href={garage.verification.nid.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-orange-500/50 transition-all group"
                >
                  <p className="text-[10px] text-white/40 uppercase font-bold mb-2">
                    NID (Owner)
                  </p>
                  <div className="flex items-center justify-between text-white text-sm">
                    <span>View Document</span>
                    <ExternalLink
                      size={14}
                      className="group-hover:text-orange-500"
                    />
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* Professional Context */}
          <div className="space-y-4">
            <h3 className="text-white/80 font-semibold border-b border-white/5 pb-2 flex items-center gap-2">
              <Wrench size={18} /> Experience & Equipment
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-xs text-white/40 mb-1">
                  Professional Summary ({garage.experience?.years || 0} Years
                  Exp)
                </p>
                <p className="text-sm text-white/90">
                  {garage.experience?.description || "No description provided."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(garage.specializedEquipments || []).map((equip, idx) => (
                  <span
                    key={idx}
                    className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-[10px] font-bold border border-purple-500/20 uppercase tracking-wider"
                  >
                    {equip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Mechanic Details */}
          <div className="space-y-4">
            <h3 className="text-white/80 font-semibold border-b border-white/5 pb-2 flex items-center gap-2">
              <User size={18} /> Mechanic Details
            </h3>
            <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-white font-bold">
                    {garage.mechanicDetails?.leadName || "N/A"}
                  </h4>
                  <p className="text-xs text-white/60">
                    Lead Mechanic •{" "}
                    {garage.mechanicDetails?.experienceYears || 0} Years
                    Experience
                  </p>
                </div>
                {garage.mechanicDetails?.certifications?.length > 0 && (
                  <div className="flex -space-x-2">
                    {garage.mechanicDetails.certifications.map((cert, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center border-2 border-[#1E1E1E] text-white"
                        title={cert.title}
                      >
                        <Award size={14} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4 pb-4">
            <h3 className="text-white/80 font-semibold border-b border-white/5 pb-2 flex items-center gap-2">
              <ImageIcon size={18} /> Garage Gallery
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {garage.garageImages?.frontView && (
                <img
                  src={garage.garageImages.frontView}
                  alt="Front View"
                  className="w-full h-32 object-cover rounded-xl border border-white/10"
                />
              )}
              {garage.garageImages?.indoorView && (
                <img
                  src={garage.garageImages.indoorView}
                  alt="Indoor View"
                  className="w-full h-32 object-cover rounded-xl border border-white/10"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          {(garage.status === "pending" || garage.status === "inactive") && (
            <button
              onClick={() => onAction("approve", garage._id)}
              className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-all"
            >
              Approve / Activate
            </button>
          )}
          {garage.status === "active" && (
            <button
              onClick={() => onAction("reject", garage._id)}
              className="px-6 py-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all font-medium"
            >
              Deactivate Garage
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
