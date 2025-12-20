"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "@/store/slices/authSlice";
import Link from "next/link";
import {
  Check,
  Sparkles,
  TrendingUp,
  Users,
  Crown,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function PricingPage() {
  const t = useTranslations("Pricing");
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly or yearly

  // Debug logs
  useEffect(() => {
    console.log("Pricing Page Auth Debug:", { isAuthenticated, user });
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/plans");
      const data = await response.json();
      if (data.success) {
        setPlans(data.data.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId, tier) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/checkout/${planId}?cycle=${billingCycle}`);
      return;
    }

    if (tier === "free") {
      // Free plan activation logic (if needed) or just redirect to dashboard
      router.push("/user/dashboard");
      return;
    }

    if (tier === "trial") {
      router.push("/trial/activate");
      return;
    }

    router.push(`/checkout/${planId}?cycle=${billingCycle}`);
  };

  const getPlanIcon = (tier) => {
    switch (tier) {
      case "free":
        return <Sparkles className="w-8 h-8" />;
      case "standard":
        return <TrendingUp className="w-8 h-8" />;
      case "premium":
        return <Crown className="w-8 h-8" />;
      case "enterprise":
        return <Users className="w-8 h-8" />;
      default:
        return <Check className="w-8 h-8" />;
    }
  };

  const getPlanColor = (tier) => {
    switch (tier) {
      case "free":
        return "from-slate-500 to-slate-600";
      case "standard":
        return "from-green-500 to-green-600";
      case "premium":
        return "from-orange-500 to-red-600";
      case "enterprise":
        return "from-purple-600 to-purple-800";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black py-16 px-4 sm:px-6">
      {/* Social Proof Banner */}
      <div className="max-w-4xl mx-auto text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-gray-400 border-2 border-gray-900"
              ></div>
            ))}
          </div>
          <span className="text-gray-300 text-sm font-medium">
            Trusted by <span className="text-white font-bold">8,500+</span>{" "}
            vehicle owners
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
          {t("title")}
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          {t("description")}
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-gray-800 rounded-full p-1 shadow-lg border border-gray-700">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 sm:px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
              billingCycle === "monthly"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t("monthly")}
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 sm:px-8 py-3 rounded-full font-semibold transition-all duration-300 relative ${
              billingCycle === "yearly"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t("yearly")}
            <span className="absolute -top-3 -right-2 bg-green-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full animate-bounce shadow-lg">
              SAVE 25%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-[95rem] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 px-2">
        {plans.map((plan) => {
          const price =
            billingCycle === "monthly" ? plan.price.monthly : plan.price.yearly;
          const monthlyPrice =
            billingCycle === "yearly"
              ? Math.round(plan.price.yearly / 12)
              : plan.price.monthly;

          // Psychological Triggers
          const isStandard = plan.tier === "standard";
          const isPremium = plan.tier === "premium";
          const isFree = plan.tier === "free";

          return (
            <div
              key={plan._id}
              className={`relative rounded-3xl p-6 shadow-2xl transform transition-all duration-300 hover:scale-105 flex flex-col ${
                isStandard
                  ? "bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-green-500/50 scale-105 z-10 shadow-green-900/20"
                  : isPremium
                  ? "bg-gray-800 border border-orange-500/30"
                  : "bg-gray-800 border border-gray-700"
              }`}
            >
              {isStandard && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-full text-center">
                  <span className="bg-green-500 text-black px-6 py-1.5 rounded-full text-xs font-bold shadow-lg uppercase tracking-wide flex items-center justify-center gap-1 w-max mx-auto">
                    <TrendingUp className="w-3 h-3" /> MOST POPULAR
                  </span>
                </div>
              )}
              {isPremium && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Limited Slots
                  </span>
                </div>
              )}

              {/* Header Section */}
              <div className="mb-6">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getPlanColor(
                    plan.tier
                  )} flex items-center justify-center mb-4 text-white shadow-lg`}
                >
                  {getPlanIcon(plan.tier)}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-400 h-10 line-clamp-2">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-gray-700/50">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">
                    {plan.tier === "enterprise" ? "Custom" : `৳${monthlyPrice}`}
                  </span>
                  {plan.tier !== "enterprise" && (
                    <span className="ml-1 text-sm text-gray-400">
                      {t("perMonth")}
                    </span>
                  )}
                </div>
                {billingCycle === "yearly" &&
                  plan.tier !== "free" &&
                  plan.tier !== "enterprise" && (
                    <p className="text-xs mt-2 text-green-400 font-medium">
                      {t("billedYearly", { price: plan.price.yearly })}
                    </p>
                  )}
                {isFree && (
                  <p className="text-xs mt-2 text-gray-500">
                    No credit card required
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 p-0.5 rounded-full ${
                        isStandard ? "bg-green-500/20" : "bg-gray-700"
                      }`}
                    >
                      <Check
                        className={`w-3 h-3 ${
                          isStandard ? "text-green-400" : "text-gray-300"
                        }`}
                      />
                    </div>
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan._id, plan.tier)}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl mt-auto flex items-center justify-center gap-2 ${
                  isStandard
                    ? "bg-green-500 text-black hover:bg-green-400"
                    : isPremium
                    ? "bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700"
                    : isFree
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                {isFree ? "Start for Free" : "Upgrade Now"}
                {isStandard && <ArrowRight className="w-4 h-4" />}
              </button>

              {/* Guarantee */}
              {plan.tier !== "free" && plan.tier !== "enterprise" && (
                <p className="text-[10px] text-center text-gray-500 mt-4">
                  7-day money-back guarantee
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ / Comparison Section */}
      <div className="max-w-7xl mx-auto mt-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">{t("needHelp")}</h2>
        <p className="text-gray-400 mb-8">{t("helpDesc")}</p>
        <Link
          href="/contact"
          className="inline-block bg-gray-800 text-white px-8 py-4 rounded-lg hover:bg-gray-700 transition-colors duration-300"
        >
          {t("contactSupport")}
        </Link>
      </div>
    </div>
  );
}

function ArrowRight({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
