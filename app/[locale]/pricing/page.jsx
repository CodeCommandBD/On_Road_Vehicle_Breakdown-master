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
  CheckCircle,
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
  const [planType, setPlanType] = useState("user");
  const [now, setNow] = useState(new Date().getTime());

  // Debug logs
  useEffect(() => {
    console.log("Pricing Page Auth Debug:", { isAuthenticated, user });
  }, [isAuthenticated, user]);

  // Update current time every second (Bangladesh timezone)
  useEffect(() => {
    const updateBangladeshTime = () => {
      // Get current time in Bangladesh (UTC+6)
      const bdTime = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
      );
      setNow(bdTime.getTime());
    };

    updateBangladeshTime(); // Initial update
    const interval = setInterval(updateBangladeshTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/packages?type=${planType}&isActive=true`
        );
        const data = await response.json();
        if (data.success) {
          // Map Package model fields to match what PricingPage expects
          const mappedPackages = data.data.packages.map((pkg) => ({
            ...pkg,
            features: pkg.benefits || [],
          }));
          setPlans(mappedPackages);
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [planType]);

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

    // Enterprise plans - Contact Sales instead of checkout
    if (tier === "enterprise") {
      router.push("/contact-sales");
      return;
    }

    router.push(`/checkout/${planId}?cycle=${billingCycle}`);
  };

  const getPlanIcon = (tier) => {
    switch (tier) {
      case "trial":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "free":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "standard":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "premium":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "enterprise":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      default:
        return <CheckCircle className="w-8 h-8 text-green-500" />;
    }
  };

  const getPlanColor = (tier) => {
    switch (tier) {
      case "standard":
        return "border-[#f97316]";
      default:
        return "border-[#333]";
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

        {/* User vs Garage Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 p-1 rounded-xl inline-flex">
            <button
              onClick={() => setPlanType("user")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                planType === "user"
                  ? "bg-white text-black shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Vehicle Owners
            </button>
            <button
              onClick={() => setPlanType("garage")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                planType === "garage"
                  ? "bg-white text-black shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Garage Owners
            </button>
          </div>
        </div>

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
              SAVE {planType === "garage" ? "20" : "25"}%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div
        className={`max-w-[95rem] mx-auto grid grid-cols-1 md:grid-cols-2 ${
          planType === "user" ? "lg:grid-cols-5" : "lg:grid-cols-2"
        } gap-4 lg:gap-6 px-2`}
      >
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
          const isFree = plan.tier === "free" || plan.tier === "trial";
          const isTrial = plan.tier === "trial";

          // Timer Calculation - Robust Logic
          let timeLeft = "";
          let isExpired = false;

          if (plan.promoEndsAt) {
            const promoDate = new Date(plan.promoEndsAt).getTime();
            const distance = promoDate - now;

            if (distance <= 0) {
              isExpired = true;
              timeLeft = "00:00:00";
            } else {
              // Calculate H, M, S
              const hours = Math.floor(distance / (1000 * 60 * 60));
              const minutes = Math.floor(
                (distance % (1000 * 60 * 60)) / (1000 * 60)
              );
              const seconds = Math.floor((distance % (1000 * 60)) / 1000);

              // Format: HH:MM:SS
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
              className={`relative rounded-2xl p-8 transition-all duration-300 flex flex-col min-h-[500px] ${
                isStandard
                  ? "bg-[#1a1a1a] border-2 border-[#f97316] shadow-[0_0_30px_rgba(249,115,22,0.15)]"
                  : "bg-[#1a1a1a] border border-[#333] hover:border-[#444]"
              } ${
                isExpired
                  ? "opacity-60 saturate-0 pointer-events-none"
                  : "hover:translate-y-[-4px]"
              }`}
            >
              {/* Expired Overlay */}
              {isExpired && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                  <div className="bg-red-600/90 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black text-xl rotate-[-12deg] shadow-[0_0_30px_rgba(220,38,38,0.5)] border-4 border-white/20 uppercase tracking-tighter">
                    Offer Expired
                  </div>
                </div>
              )}

              {isStandard && !isExpired && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#f97316] text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Header Section */}
              <div className="mb-6 relative">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getPlanColor(
                    plan.tier
                  )} flex items-center justify-center mb-8 text-white shadow-2xl group-hover:scale-110 transition-transform`}
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
                    {plan.tier === "enterprise" ? "Custom" : `৳${price}`}
                  </span>
                </div>
                {plan.tier !== "enterprise" && (
                  <p className="text-sm text-gray-500 mt-1">
                    per {billingCycle === "yearly" ? "year" : "month"}
                  </p>
                )}

                {billingCycle === "yearly" && plan.tier !== "trial" && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-green-400 font-black bg-green-500/10 px-2 py-1 rounded text-nowrap">
                      SAVE {plan.discount || 25}%
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
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
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
                  : isFree
                  ? "Current Plan"
                  : "Upgrade Now"}
              </button>
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
