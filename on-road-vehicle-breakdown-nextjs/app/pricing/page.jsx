"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Check, Sparkles, TrendingUp, Users, Crown } from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly or yearly

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/plans");
      const data = await response.json();
      if (data.success) {
        // Filter out trial plan from display
        setPlans(data.data.plans.filter((p) => p.tier !== "trial"));
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId, tier) => {
    if (!session) {
      // Redirect to login with return URL
      router.push(`/auth/login?redirect=/pricing`);
      return;
    }

    // Redirect to checkout
    router.push(`/checkout/${planId}?cycle=${billingCycle}`);
  };

  const handleStartTrial = () => {
    if (!session) {
      router.push(`/auth/login?redirect=/pricing`);
      return;
    }
    // Activate trial
    router.push(`/trial/activate`);
  };

  const getPlanIcon = (tier) => {
    switch (tier) {
      case "basic":
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black py-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
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
            className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
              billingCycle === "monthly"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 relative ${
              billingCycle === "yearly"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Free Trial Banner */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
          <h3 className="text-3xl font-bold text-white mb-4">
            🎉 Start Your 7-Day Free Trial!
          </h3>
          <p className="text-white/90 text-lg mb-6">
            Experience our Basic plan features with 1 free service call. No
            credit card required!
          </p>
          <button
            onClick={handleStartTrial}
            className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Start Free Trial →
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map((plan) => {
          const price =
            billingCycle === "monthly" ? plan.price.monthly : plan.price.yearly;
          const monthlyPrice =
            billingCycle === "yearly"
              ? Math.round(plan.price.yearly / 12)
              : plan.price.monthly;

          return (
            <div
              key={plan._id}
              className={`relative rounded-2xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 ${
                plan.isFeatured
                  ? "bg-gradient-to-br from-orange-500 via-red-600 to-pink-600 ring-4 ring-yellow-400"
                  : "bg-gray-800 hover:bg-gray-750"
              }`}
            >
              {plan.isFeatured && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    ⭐ MOST POPULAR
                  </span>
                </div>
              )}

              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${getPlanColor(
                  plan.tier
                )} flex items-center justify-center mb-6 text-white shadow-lg`}
              >
                {getPlanIcon(plan.tier)}
              </div>

              {/* Plan Name */}
              <h3
                className={`text-2xl font-bold mb-2 ${
                  plan.isFeatured ? "text-white" : "text-white"
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`text-sm mb-6 ${
                  plan.isFeatured ? "text-white/80" : "text-gray-400"
                }`}
              >
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span
                    className={`text-5xl font-bold ${
                      plan.isFeatured ? "text-white" : "text-white"
                    }`}
                  >
                    ৳{monthlyPrice}
                  </span>
                  <span
                    className={`ml-2 ${
                      plan.isFeatured ? "text-white/80" : "text-gray-400"
                    }`}
                  >
                    /month
                  </span>
                </div>
                {billingCycle === "yearly" && (
                  <p
                    className={`text-sm mt-2 ${
                      plan.isFeatured ? "text-white/70" : "text-gray-500"
                    }`}
                  >
                    Billed ৳{price} yearly
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        plan.isFeatured ? "text-white" : "text-green-500"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        plan.isFeatured ? "text-white/90" : "text-gray-300"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan._id, plan.tier)}
                className={`w-full py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                  plan.isFeatured
                    ? "bg-white text-orange-600 hover:bg-gray-100"
                    : "bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700"
                }`}
              >
                Get Started →
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
          Contact Sales
        </Link>
      </div>
    </div>
  );
}
