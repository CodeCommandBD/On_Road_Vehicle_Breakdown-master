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
              className={`relative rounded-3xl p-6 shadow-2xl transition-all duration-500 flex flex-col ${
                isStandard
                  ? "bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-green-500/50 scale-105 z-10 shadow-green-900/40"
                  : isPremium
                  ? "bg-gray-800 border-2 border-orange-500/30 shadow-orange-900/20"
                  : "bg-gray-800 border border-gray-700"
              } ${
                isExpired
                  ? "opacity-60 scale-95 saturate-0 pointer-events-none"
                  : "hover:scale-[1.07] hover:z-20 group"
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
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-full text-center z-10">
                  <span className="bg-green-500 text-black px-6 py-1.5 rounded-full text-xs font-bold shadow-lg uppercase tracking-wide flex items-center justify-center gap-1 w-max mx-auto animate-bounce">
                    <TrendingUp className="w-3 h-3" /> MOST POPULAR
                  </span>
                </div>
              )}

              {isPremium && !isExpired && (
                <div className="absolute -top-3 right-4 z-10">
                  <span className="bg-red-500 text-white border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-900/40">
                    <AlertTriangle className="w-3 h-3 animate-pulse" /> Limited
                    Slots
                  </span>
                </div>
              )}

              {/* Header Section */}
              <div className="mb-6 relative">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getPlanColor(
                    plan.tier
                  )} flex items-center justify-center mb-6 text-white shadow-xl group-hover:rotate-6 transition-transform`}
                >
                  {getPlanIcon(plan.tier)}
                </div>

                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">
                  {plan.name}
                </h3>

                {/* Robust Timer Display */}
                {plan.promoEndsAt && !isExpired && (
                  <div className="mt-2 mb-4 inline-flex items-center gap-3 bg-red-500/10 border border-red-500/40 px-4 py-2 rounded-xl group-hover:bg-red-500/20 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-red-300 font-bold uppercase tracking-widest">
                        Ending In
                      </span>
                      <span className="text-red-400 font-mono text-lg font-black tracking-tighter">
                        {timeLeft}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-400 h-10 line-clamp-2 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8 p-6 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white tracking-tighter">
                    {plan.tier === "enterprise" ? "Custom" : `৳${monthlyPrice}`}
                  </span>
                  {plan.tier !== "enterprise" && (
                    <span className="text-sm text-gray-500 font-bold uppercase">
                      /mo
                    </span>
                  )}
                </div>
                {billingCycle === "yearly" && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-green-400 font-black bg-green-500/10 px-2 py-1 rounded text-nowrap">
                      SAVE {plan.discount || 25}%
                    </span>
                    <span className="text-[10px] text-gray-500 line-through">
                      ৳{plan.price.monthly * 12}
                    </span>
                  </div>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-4 group/item">
                    <div
                      className={`mt-1 p-1 rounded-full transition-colors ${
                        isStandard
                          ? "bg-green-500/20 group-hover/item:bg-green-500/40"
                          : "bg-gray-700 group-hover/item:bg-gray-600"
                      }`}
                    >
                      <Check
                        className={`w-3 h-3 ${
                          isStandard ? "text-green-400" : "text-gray-300"
                        }`}
                      />
                    </div>
                    <span className="text-sm text-gray-300 font-medium leading-tight group-hover/item:text-white transition-colors">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <button
                onClick={() => handleSelectPlan(plan._id, plan.tier)}
                disabled={isExpired}
                className={`w-full py-5 rounded-2xl font-black text-sm transition-all duration-300 transform mt-auto flex items-center justify-center gap-2 tracking-widest uppercase ${
                  isExpired
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : isStandard
                    ? "bg-green-500 text-black hover:bg-green-400 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(34,197,94,0.4)]"
                    : isPremium
                    ? "bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(249,115,22,0.4)]"
                    : "bg-white text-black hover:bg-gray-100 hover:-translate-y-1 hover:shadow-xl"
                }`}
              >
                {isExpired
                  ? "OFFER EXPIRED"
                  : isFree
                  ? "Get Started"
                  : "Upgrade Now"}
                {!isExpired && <ArrowRight className="w-4 h-4" />}
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
