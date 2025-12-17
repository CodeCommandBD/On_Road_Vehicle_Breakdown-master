"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "@/store/slices/authSlice";
import Link from "next/link";
import { Check, Sparkles, TrendingUp, Users, Crown } from "lucide-react";

export default function PricingPage() {
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
        // Sort plans effectively if needed, but assuming API returns in displayOrder
        setPlans(data.data.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId, tier) => {
    console.log("Handle Select Plan Clicked:", {
      planId,
      isAuthenticated,
      user: user?.email,
    });

    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/checkout/${planId}?cycle=${billingCycle}`);
      return;
    }

    if (tier === "trial") {
      router.push("/trial/activate");
      return;
    }

    // Redirect to checkout
    router.push(`/checkout/${planId}?cycle=${billingCycle}`);
  };

  const getPlanIcon = (tier) => {
    switch (tier) {
      case "trial":
        return <Sparkles className="w-8 h-8" />;
      case "basic":
        return <Check className="w-8 h-8" />;
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
      case "trial":
        return "from-purple-500 to-pink-500";
      case "basic":
        return "from-blue-500 to-blue-600";
      case "standard":
        return "from-green-500 to-green-600";
      case "premium":
        return "from-orange-500 to-red-600";
      case "enterprise":
        return "from-purple-500 to-purple-700";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black py-16 px-4 sm:px-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
          Choose Your Perfect Plan
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          Get 24/7 vehicle breakdown assistance with our flexible membership
          plans. Save 17% with annual billing!
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-gray-800 rounded-full p-1 shadow-lg">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 sm:px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
              billingCycle === "monthly"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 sm:px-8 py-3 rounded-full font-semibold transition-all duration-300 relative ${
              billingCycle === "yearly"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Yearly
            <span className="absolute -top-3 -right-2 bg-green-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full animate-bounce">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-[95rem] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
        {plans.map((plan) => {
          const price =
            billingCycle === "monthly" ? plan.price.monthly : plan.price.yearly;
          const monthlyPrice =
            billingCycle === "yearly"
              ? Math.round(plan.price.yearly / 12)
              : plan.price.monthly;
          const isTrial = plan.tier === "trial";

          return (
            <div
              key={plan._id}
              className={`relative rounded-2xl p-6 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-2 flex flex-col ${
                plan.isFeatured
                  ? "bg-gradient-to-br from-orange-500 via-red-600 to-pink-600 ring-4 ring-yellow-400 scale-105 z-10"
                  : isTrial
                  ? "bg-gradient-to-br from-purple-900 to-gray-900 border border-purple-500/30"
                  : "bg-gray-800 hover:bg-gray-750"
              }`}
            >
              {plan.isFeatured && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-full text-center">
                  <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-xs font-bold shadow-lg uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}
              {isTrial && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-full text-center">
                  <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg uppercase tracking-wide">
                    Free for 7 Days
                  </span>
                </div>
              )}

              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-full bg-gradient-to-br ${getPlanColor(
                  plan.tier
                )} flex items-center justify-center mb-6 text-white shadow-lg mx-auto`}
              >
                {getPlanIcon(plan.tier)}
              </div>

              {/* Plan Name */}
              <div className="text-center mb-4">
                <h3
                  className={`text-xl font-bold ${
                    plan.isFeatured ? "text-white" : "text-white"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-xs mt-1 h-10 line-clamp-2 ${
                    plan.isFeatured ? "text-white/80" : "text-gray-400"
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6 text-center border-b border-gray-700/50 pb-6">
                <div className="flex items-baseline justify-center">
                  <span
                    className={`text-4xl font-bold ${
                      plan.isFeatured ? "text-white" : "text-white"
                    }`}
                  >
                    ৳{monthlyPrice}
                  </span>
                  <span
                    className={`ml-1 text-sm ${
                      plan.isFeatured ? "text-white/80" : "text-gray-400"
                    }`}
                  >
                    /mo
                  </span>
                </div>
                {billingCycle === "yearly" && !isTrial && (
                  <p
                    className={`text-xs mt-1 ${
                      plan.isFeatured ? "text-white/70" : "text-gray-500"
                    }`}
                  >
                    Billed ৳{price} yearly
                  </p>
                )}
                {isTrial && (
                  <p className="text-xs mt-1 text-purple-400">
                    No credit card required
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.slice(0, 5).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.isFeatured
                          ? "text-white"
                          : isTrial
                          ? "text-purple-400"
                          : "text-green-500"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        plan.isFeatured ? "text-white/90" : "text-gray-300"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li className="text-center pt-2">
                    <span className="text-xs text-gray-500">
                      + {plan.features.length - 5} more features
                    </span>
                  </li>
                )}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan._id, plan.tier)}
                className={`w-full py-3 rounded-lg font-bold text-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl mt-auto ${
                  plan.isFeatured
                    ? "bg-white text-orange-600 hover:bg-gray-100"
                    : isTrial
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700"
                }`}
              >
                {isTrial ? "Try Free Now" : "Choose Plan"}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ / Comparison Section */}
      <div className="max-w-7xl mx-auto mt-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Need help choosing?
        </h2>
        <p className="text-gray-400 mb-8">
          All plans include mobile app access, real-time tracking, and secure
          payments
        </p>
        <Link
          href="/contact"
          className="inline-block bg-gray-800 text-white px-8 py-4 rounded-lg hover:bg-gray-700 transition-colors duration-300"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
