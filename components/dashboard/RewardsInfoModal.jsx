"use client";

import { X, Award, Zap, Shield, Gift, ChevronRight, Info } from "lucide-react";
import { useTranslations } from "next-intl";

export default function RewardsInfoModal({ isOpen, onClose }) {
  const t = useTranslations("Rewards");

  if (!isOpen) return null;

  const earnRules = [
    {
      action: t("completeService"),
      points: "+50 Pts",
      description: t("completeServiceDesc"),
      icon: Gift,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      action: t("sosHero"),
      points: "+100 Pts",
      description: t("sosHeroDesc"),
      icon: Zap,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
    {
      action: t("sosConfirm"),
      points: "+20 Pts",
      description: t("sosConfirmDesc"),
      icon: Award,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  const tiers = [
    { name: "Free", limit: "0 Pts", perk: t("freePerk") },
    { name: "Basic", limit: "500 Pts", perk: t("basicPerk") },
    {
      name: "Standard",
      limit: "1500 Pts",
      perk: t("standardPerk"),
    },
    { name: "Premium", limit: "3000 Pts", perk: t("premiumPerk") },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#1A1A1A] border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="relative h-40 bg-gradient-to-br from-orange-500/20 to-red-600/20 flex items-center px-8 border-b border-white/10 overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/20 blur-3xl rounded-full"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-red-600/10 blur-3xl rounded-full"></div>

          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Award className="text-white" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                {t("title")}
              </h2>
              <p className="text-white/60 text-sm">{t("subtitle")}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-full transition-all border border-white/5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
          {/* Section: How to Earn */}
          <div className="mb-10">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-xs opacity-40">
              <Info size={14} /> {t("howToEarn")}
            </h3>
            <div className="grid gap-4">
              {earnRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-5 bg-white/5 border border-white/5 rounded-3xl hover:border-white/10 transition-colors group"
                >
                  <div
                    className={`w-12 h-12 ${rule.bg} rounded-2xl flex items-center justify-center shrink-0`}
                  >
                    <rule.icon className={rule.color} size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-white group-hover:text-orange-500 transition-colors">
                        {rule.action}
                      </p>
                      <span className={`text-sm font-black ${rule.color}`}>
                        {rule.points}
                      </span>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Membership Tiers */}
          <div>
            <h3 className="text-white font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-xs opacity-40">
              <Shield size={14} /> {t("membershipTiers")}
            </h3>
            <div className="bg-white/5 rounded-3xl overflow-hidden border border-white/5">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/40 uppercase text-[10px] font-black tracking-tighter">
                  <tr>
                    <th className="px-6 py-4">{t("tier")}</th>
                    <th className="px-6 py-4 text-center">{t("threshold")}</th>
                    <th className="px-6 py-4">{t("topBenefit")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tiers.map((t, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-white">
                        {t.name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-white/5 rounded-full text-white/60 text-xs">
                          {t.limit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60">{t.perk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 p-6 bg-orange-500/10 rounded-[2rem] border border-orange-500/20 text-center">
            <p className="text-sm text-orange-200/60 leading-relaxed">
              {t("disclaimer")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
