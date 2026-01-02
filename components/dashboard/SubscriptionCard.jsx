"use client";

import { useState, useEffect } from "react";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import {
  Crown,
  Calendar,
  Zap,
  TrendingUp,
  X,
  Info,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function SubscriptionCard() {
  const t = useTranslations("Subscription");
  const commonT = useTranslations("Common");
  const router = useRouterWithLoading(); // Regular routing
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscriptions");
      const data = await response.json();
      if (data.success && data.data.current) {
        setSubscription(data.data.current);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanColor = (tier) => {
    const colors = {
      trial: "from-purple-500 to-pink-500",
      free: "from-slate-600 to-slate-800",
      standard: "from-green-500 to-green-600",
      premium: "from-orange-500 to-red-600",
      enterprise: "from-purple-600 to-purple-800",
    };
    return colors[tier] || "from-gray-500 to-gray-600";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return 999;
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getUsagePercentage = () => {
    if (!subscription || !subscription.planId) return 0;
    const limit = subscription.planId.limits?.serviceCalls || 0;
    const used = subscription.usage?.serviceCallsUsed || 0;
    if (limit === -1) return 0; // Unlimited
    return Math.min(100, Math.round((used / limit) * 100));
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-2xl p-8 shadow-xl animate-pulse h-full">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 shadow-2xl h-full flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>

        <div>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {t("noSubscription")}
              </h3>
              <p className="text-white/90 font-medium">{t("subscribeOffer")}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Crown className="w-8 h-8 text-yellow-300" />
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-white/90">
              <CheckCircle className="w-5 h-5 text-yellow-300" />
              <span>Priority 24/7 Support</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <CheckCircle className="w-5 h-5 text-yellow-300" />
              <span>Nationwide Coverage</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <CheckCircle className="w-5 h-5 text-yellow-300" />
              <span>Save ৳5000+ per year</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/trial/activate"
            className="w-full bg-white text-orange-600 px-6 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 text-center shadow-lg flex items-center justify-center gap-2"
          >
            {t("startTrial")} <ArrowUpRight className="w-4 h-4" />
          </Link>
          <p className="text-center text-white/60 text-xs">
            Limited time offer: 7 days free
          </p>
        </div>
      </div>
    );
  }

  const plan = subscription.planId || {
    name: "Unknown Plan",
    tier: "free",
    limits: { serviceCalls: 0 },
  };
  const daysRemaining = getDaysRemaining(subscription.endDate);
  const isExpiringSoon = daysRemaining <= 7;
  const isTrial = subscription.status === "trial";
  const isFree = plan.tier === "free";
  const usagePercent = getUsagePercentage();
  const isHighUsage = usagePercent >= 80;

  return (
    <>
      <div
        className={`bg-gradient-to-br ${getPlanColor(
          plan.tier
        )} rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden h-full flex flex-col`}
      >
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>

        {/* Header */}
        <div className="relative z-10 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {plan.name}
                </h3>
                {plan.isFeatured && (
                  <span className="bg-yellow-400 text-gray-900 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                    PRO
                  </span>
                )}
                {isTrial && (
                  <span className="bg-purple-400 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                    TRIAL
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm">
                Protected since {formatDate(subscription.startDate)}
              </p>
            </div>
            <Crown
              className={`w-8 h-8 ${
                isFree ? "text-gray-400" : "text-yellow-300"
              }`}
            />
          </div>
        </div>

        {/* Usage Meter (Crucial for Free/Limited plans) */}
        {!isFree && plan.limits?.serviceCalls !== -1 && (
          <div className="bg-black/20 rounded-xl p-4 mb-6 backdrop-blur-sm relative z-10 border border-white/5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/80">Service Usage</span>
              <span
                className={`font-bold ${
                  isHighUsage ? "text-red-300" : "text-white"
                }`}
              >
                {usagePercent}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isHighUsage ? "bg-red-500" : "bg-green-400"
                }`}
                style={{ width: `${usagePercent}%` }}
              ></div>
            </div>
            {isHighUsage && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-200 bg-red-500/10 p-2 rounded-lg">
                <AlertTriangle className="w-3 h-3" />
                <span>{t("almostLimit")}</span>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-white/60 text-xs mb-1">{t("status")}</p>
            <div className="text-white font-bold capitalize flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  subscription.status === "active"
                    ? "bg-green-400"
                    : "bg-yellow-400"
                }`}
              ></div>
              {subscription.status}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-white/60 text-xs mb-1">{t("renews")}</p>
            <p
              className={`font-bold ${
                isExpiringSoon ? "text-red-300" : "text-white"
              }`}
            >
              {t("days", { count: daysRemaining })}
            </p>
          </div>
        </div>

        {/* Dedicated Support indicator for Premium/Enterprise */}
        {(plan.tier === "premium" || plan.tier === "enterprise") && (
          <div className="mb-6 relative z-10">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/5 flex items-center gap-3">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-white font-bold text-xs">
                  {t("dedicatedManager")}
                </p>
                <p className="text-white/60 text-[10px]">
                  {t("vipSupportActive")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Nudge (Psychological) */}
        <div className="mt-auto relative z-10">
          {isFree || isTrial || isHighUsage ? (
            <Link
              href="/pricing"
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 py-3 rounded-xl font-bold hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 text-center flex items-center justify-center gap-2 shadow-lg animate-pulse-slow"
            >
              <Zap className="w-4 h-4" />
              {isFree ? t("upgradeToProtected") : t("extendProtection")}
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/pricing"
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-center text-sm font-medium transition-colors"
              >
                {t("changePlan")}
              </Link>
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-3 text-white/40 hover:text-white/80 text-sm transition-colors"
              >
                {t("cancel")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[50] p-4">
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-white mb-2">
              {t("cancelTitle")}
            </h3>
            <p className="text-gray-400 mb-6">
              {t("cancelDesc", { date: formatDate(subscription.endDate) })}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full bg-green-500 text-black px-6 py-3.5 rounded-xl font-bold hover:bg-green-400 transition-all"
              >
                {t("keepProtection")}
              </button>
              <button
                onClick={() => {
                  alert("Cancellation flow triggered");
                  setShowCancelModal(false);
                }}
                className="w-full bg-white/5 text-gray-400 px-6 py-3 rounded-xl font-medium hover:bg-white/10 hover:text-white transition-all"
              >
                {t("confirmCancellation")}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-green-400">{t("proTip")}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
