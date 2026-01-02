import React from "react";
import { useTranslations } from "next-intl";
import {
  Shield,
  Award,
  Crown,
  Star,
  User,
  Wrench,
  Users,
  Eye,
} from "lucide-react";

export default function UserBadge({ user, className = "" }) {
  const t = useTranslations("Common"); // Make sure to add translations or fallback

  if (!user) return null;

  // 1. System Admin
  if (user.role === "admin") {
    return (
      <div
        className={`px-3 py-1 rounded-lg bg-gradient-to-r from-red-600 to-black border border-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-900/40 ${className}`}
      >
        <Shield className="w-3.5 h-3.5" />
        {t("systemAdmin", { defaultMessage: "SYSTEM ADMIN" })}
      </div>
    );
  }

  // 2. Enterprise Logic
  if (user.membershipTier === "enterprise") {
    // Owner
    if (user.isEnterpriseOwner || user.enterpriseTeam?.isOwner) {
      return (
        <div
          className={`px-3 py-1 rounded-lg bg-gradient-to-r from-gray-900 to-black border border-orange-500 text-orange-500 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-orange-900/20 ${className}`}
        >
          <Crown className="w-3.5 h-3.5" />
          {t("enterpriseOwner", { defaultMessage: "ENTERPRISE OWNER" })}
        </div>
      );
    }

    // Admin
    if (user.enterpriseRole === "admin") {
      return (
        <div
          className={`px-3 py-1 rounded-lg bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-900/40 ${className}`}
        >
          <Shield className="w-3.5 h-3.5" />
          {t("enterpriseAdmin", { defaultMessage: "ENTERPRISE ADMIN" })}
        </div>
      );
    }

    // Member
    if (user.enterpriseRole === "member") {
      return (
        <div
          className={`px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 border border-blue-400 text-white font-semibold text-xs flex items-center gap-1.5 ${className}`}
        >
          <Users className="w-3.5 h-3.5" />
          {t("enterpriseMember", { defaultMessage: "ENTERPRISE MEMBER" })}
        </div>
      );
    }

    // Viewer
    if (user.enterpriseRole === "viewer") {
      return (
        <div
          className={`px-3 py-1 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 border border-gray-400 text-white font-medium text-xs flex items-center gap-1.5 ${className}`}
        >
          <Eye className="w-3.5 h-3.5" />
          {t("enterpriseViewer", { defaultMessage: "ENTERPRISE VIEWER" })}
        </div>
      );
    }

    // Fallback if role is missing but tier is enterprise (should be Member rarely)
    return (
      <div
        className={`px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-700 border border-cyan-400 text-white font-semibold text-xs flex items-center gap-1.5 ${className}`}
      >
        <Users className="w-3.5 h-3.5" />
        {t("enterpriseMember", { defaultMessage: "ENTERPRISE MEMBER" })}
      </div>
    );
  }

  // 3. Garage Logic
  if (user.role === "garage") {
    if (user.membershipTier === "professional") {
      return (
        <div
          className={`px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 border border-purple-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/30 ${className}`}
        >
          <Wrench className="w-3.5 h-3.5" />
          {t("professional", { defaultMessage: "PROFESSIONAL" })}
        </div>
      );
    }

    // Basic or fallback
    return (
      <div
        className={`px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400 text-white font-semibold text-xs flex items-center gap-1.5 ${className}`}
      >
        <Wrench className="w-3.5 h-3.5" />
        {t("garageBasic", { defaultMessage: "GARAGE BASIC" })}
      </div>
    );
  }

  // 4. Mechanic Logic
  if (user.role === "mechanic") {
    return (
      <div
        className={`px-3 py-1 rounded-lg bg-gradient-to-r from-slate-600 to-slate-800 border border-slate-500 text-white font-semibold text-xs flex items-center gap-1.5 ${className}`}
      >
        <Wrench className="w-3.5 h-3.5" />
        {t("mechanic", { defaultMessage: "MECHANIC" })}
      </div>
    );
  }

  // 5. Standard Tiers (Premium, Standard, Free)
  if (user.membershipTier === "premium") {
    return (
      <div
        className={`px-3 py-1 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 border border-yellow-300 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-yellow-600/30 ${className}`}
      >
        <Crown className="w-3.5 h-3.5" />
        {t("premiumMember", { defaultMessage: "PREMIUM MEMBER" })}
      </div>
    );
  }

  if (user.membershipTier === "standard") {
    return (
      <div
        className={`px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-fuchsia-600 border border-purple-300 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/20 ${className}`}
      >
        <Star className="w-3.5 h-3.5" />
        {t("standardMember", { defaultMessage: "STANDARD MEMBER" })}
      </div>
    );
  }

  // Free (Default)
  return (
    <div
      className={`px-3 py-1 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 border border-gray-400 text-white font-medium text-xs flex items-center gap-1.5 ${className}`}
    >
      <User className="w-3.5 h-3.5" />
      {t("freeMember", { defaultMessage: "FREE MEMBER" })}
    </div>
  );
}
