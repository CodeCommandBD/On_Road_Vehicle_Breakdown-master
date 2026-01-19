"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import {
  Loader2,
  Crown,
  Calendar,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";

export default function SubscriptionPage() {
  const user = useSelector(selectUser);
  const router = useRouterWithLoading(); // Regular routing
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [now, setNow] = useState(new Date().getTime());

  // COUNTDOWN TIMER DISABLED - No auto-reload
  // useEffect(() => {
  //   const updateBangladeshTime = () => {
  //     const bdTime = new Date(
  //       new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
  //     );
  //     setNow(bdTime.getTime());
  //   };
  //   updateBangladeshTime();
  //   const interval = setInterval(updateBangladeshTime, 1000);
  //   return () => clearInterval(interval);
  // }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptionData", user?._id],
    queryFn: async () => {
      const [plansRes, subRes] = await Promise.all([
        axiosInstance.get("/packages?type=garage&isActive=true"),
        user
          ? axiosInstance.get(`/subscriptions?userId=${user._id}`)
          : Promise.resolve({ data: { success: false } }),
      ]);

      let mappedPlans = [];
      if (plansRes.data.success) {
        mappedPlans = plansRes.data.data.packages.map((pkg) => ({
          ...pkg,
          features: pkg.benefits || [],
        }));
      }

      let currentSub = null;
      if (subRes.data.success && subRes.data.subscriptions?.length > 0) {
        currentSub = subRes.data.subscriptions[0];
      }

      return { plans: mappedPlans, subscription: currentSub };
    },
    enabled: !!user,
  });

  const plans = data?.plans || [];
  const subscription = data?.subscription;

  const handleSelectPlan = (planId, tier) => {
    if (tier === "trial") {
      router.push("/trial/activate");
      return;
    }

    if (tier === "enterprise") {
      router.push("/contact-sales");
      return;
    }

    router.push(`/checkout/${planId}?cycle=${billingCycle}`);
  };

  const getPlanIcon = (tier) => {
    switch (tier) {
      case "trial":
        return <Clock className="w-8 h-8 text-blue-500" />;
      case "free":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "standard":
        return <TrendingUp className="w-8 h-8 text-orange-500" />;
      case "premium":
        return <Sparkles className="w-8 h-8 text-purple-500" />;
      case "enterprise":
        return <Crown className="w-8 h-8 text-yellow-500" />;
      default:
        return <CheckCircle className="w-8 h-8 text-green-500" />;
    }
  };

  const getPlanColor = (tier) => {
    switch (tier) {
      case "trial":
        return "from-blue-500 to-blue-600";
      case "standard":
        return "from-orange-500 to-orange-600";
      case "premium":
        return "from-purple-500 to-purple-600";
      case "enterprise":
        return "from-yellow-500 to-yellow-600";
      default:
        return "from-green-500 to-green-600";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  const isActive = user?.membershipTier && user.membershipTier !== "free";
  const expiryDate = user?.membershipExpiry
    ? new Date(user.membershipExpiry)
    : null;
  const daysRemaining = expiryDate
    ? Math.max(0, Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Subscription</h1>
        <p className="text-white/60">
          Manage your garage membership and billing
        </p>
      </div>

      {/* Current Subscription Status */}
      <div className="bg-gradient-to-br from-orange-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              {user?.membershipTier?.toUpperCase() || "FREE"} Plan
            </h2>
            {isActive ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <span className="text-white/80">
                    {daysRemaining} days remaining
                  </span>
                </div>
                <span className="text-white/60">
                  Expires:{" "}
                  {expiryDate?.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            ) : (
              <p className="text-white/60">
                Upgrade to unlock premium features and grow your business
              </p>
            )}
          </div>
        </div>

        {/* Subscription Details */}
        {subscription && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-white/40 text-sm">Status</p>
                <p className="text-white font-medium capitalize mt-1">
                  {subscription.status}
                </p>
              </div>
              <div>
                <p className="text-white/40 text-sm">Billing Cycle</p>
                <p className="text-white font-medium capitalize mt-1">
                  {subscription.billingCycle}
                </p>
              </div>
              <div>
                <p className="text-white/40 text-sm">Auto-Renew</p>
                <p className="text-white font-medium mt-1">
                  {subscription.autoRenew ? "Enabled" : "Disabled"}
                </p>
              </div>
              <div>
                <p className="text-white/40 text-sm">Service Calls Used</p>
                <p className="text-white font-medium mt-1">
                  {subscription.usage?.serviceCallsUsed || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Options */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-white">Upgrade Your Plan</h2>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center bg-gray-800 rounded-full p-1 shadow-lg border border-gray-700">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 text-sm ${
                billingCycle === "monthly"
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 relative text-sm ${
                billingCycle === "yearly"
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-lg">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards - Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {plans.map((plan) => {
            const price =
              billingCycle === "monthly"
                ? plan.price.monthly
                : plan.price.yearly;
            const isCurrent = user?.membershipTier === plan.tier;
            const isStandard = plan.tier === "standard";
            const isTrial = plan.tier === "trial";
            const isEnterprise = plan.tier === "enterprise";

            // Timer Calculation
            let timeLeft = "";
            let isExpired = false;

            if (plan.promoEndsAt) {
              const promoDate = new Date(plan.promoEndsAt).getTime();
              const distance = promoDate - now;

              if (distance <= 0) {
                isExpired = true;
                timeLeft = "00:00:00";
              } else {
                const hours = Math.floor(distance / (1000 * 60 * 60));
                const minutes = Math.floor(
                  (distance % (1000 * 60 * 60)) / (1000 * 60),
                );
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                timeLeft = [
                  hours.toString().padStart(2, "0"),
                  minutes.toString().padStart(2, "0"),
                  seconds.toString().padStart(2, "0"),
                ].join(":");
              }
            }

            return (
              <div
                key={plan._id}
                className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col min-h-[500px] ${
                  plan.isFeatured
                    ? "bg-[#1a1a1a] border-2 border-yellow-500/60 shadow-[0_0_40px_rgba(234,179,8,0.25)] scale-105"
                    : isStandard
                      ? "bg-[#1a1a1a] border-2 border-[#f97316] shadow-[0_0_30px_rgba(249,115,22,0.15)]"
                      : "bg-[#1a1a1a] border border-[#333] hover:border-[#444]"
                } ${
                  isExpired
                    ? "opacity-60 saturate-0 pointer-events-none"
                    : "hover:translate-y-[-4px]"
                }`}
              >
                {/* Featured Badge */}
                {plan.isFeatured && !isExpired && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-white flex items-center gap-2 shadow-lg animate-pulse z-10">
                    <Sparkles size={16} fill="white" />⭐ FEATURED
                  </div>
                )}

                {/* Expired Overlay */}
                {isExpired && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                    <div className="bg-red-600/90 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black text-xl rotate-[-12deg] shadow-[0_0_30px_rgba(220,38,38,0.5)] border-4 border-white/20 uppercase tracking-tighter">
                      Offer Expired
                    </div>
                  </div>
                )}

                {/* Most Popular Badge */}
                {isStandard && !isExpired && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#f97316] text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Promo Countdown */}
                {plan.promoEndsAt && !isExpired && (
                  <div className="absolute -top-3 -right-3 bg-red-600 text-white px-3 py-2 rounded-xl shadow-lg">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs font-bold">{timeLeft}</span>
                    </div>
                  </div>
                )}

                {/* Header Section */}
                <div className="mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getPlanColor(
                      plan.tier,
                    )} flex items-center justify-center mb-4 shadow-2xl hover:scale-110 transition-transform`}
                  >
                    {getPlanIcon(plan.tier)}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-wider">
                    {plan.name}
                  </h3>
                </div>

                {/* Price Section */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      {isEnterprise ? "Custom" : `৳${price}`}
                    </span>
                  </div>
                  {!isEnterprise && (
                    <p className="text-sm text-gray-500 mt-1">
                      per {billingCycle === "yearly" ? "year" : "month"}
                    </p>
                  )}

                  {billingCycle === "yearly" && !isTrial && !isEnterprise && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-green-400 font-black bg-green-500/10 px-2 py-1 rounded">
                        SAVE {plan.discount || 20}%
                      </span>
                      <span className="text-[10px] text-gray-500 line-through">
                        ৳{plan.price.monthly * 12}
                      </span>
                    </div>
                  )}

                  {isTrial && (
                    <div className="mt-3 text-xs text-blue-400 font-bold bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                      * Credit Card Info Required
                    </div>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-white/80 text-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-4 rounded-xl bg-[#333] text-white/40 font-bold text-sm cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan._id, plan.tier)}
                    disabled={isExpired}
                    className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                      isStandard
                        ? "bg-gradient-to-r from-[#f97316] to-[#a855f7] text-white hover:brightness-110 shadow-lg shadow-orange-500/20"
                        : "bg-[#333] text-white hover:bg-[#444]"
                    }`}
                  >
                    {isExpired
                      ? "OFFER EXPIRED"
                      : isTrial
                        ? "Start Trial"
                        : isEnterprise
                          ? "Contact Sales"
                          : "Upgrade Now"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-3">Need Help?</h3>
        <p className="text-white/60 mb-4">
          Have questions about our plans or billing? Our support team is here to
          help.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
