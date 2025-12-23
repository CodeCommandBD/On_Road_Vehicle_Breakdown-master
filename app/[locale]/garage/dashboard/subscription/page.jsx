"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import { Loader2, Crown, Calendar, CheckCircle, Sparkles } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";

export default function SubscriptionPage() {
  const user = useSelector(selectUser);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch plans
        const plansRes = await axios.get("/api/plans");
        if (plansRes.data.success) {
          setPlans(plansRes.data.data.plans);
        }

        if (user) {
          // Fetch current subscription
          const subRes = await axios.get(
            `/api/subscriptions?userId=${user._id}`
          );
          if (subRes.data.success && subRes.data.subscriptions?.length > 0) {
            setSubscription(subRes.data.subscriptions[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

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
    <div className="space-y-6">
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
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-bold text-white">Upgrade Your Plan</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = user?.membershipTier === plan.tier;

            // Skip displaying current plan if desired, or style it differently
            // For now, we'll show all but disable the button for current plan

            return (
              <div
                key={plan._id}
                className={`relative rounded-2xl p-8 transition-all duration-300 flex flex-col min-h-[450px] ${
                  plan.isFeatured
                    ? "bg-[#1a1a1a] border-2 border-[#f97316] shadow-[0_0_30px_rgba(249,115,22,0.15)]"
                    : "bg-[#1a1a1a] border border-[#333] hover:border-[#444]"
                }`}
              >
                {plan.isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-[#f97316] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-wider">
                  {plan.name}
                </h3>
                <div className="text-4xl font-bold text-white mb-1">
                  ৳{plan.price.monthly}
                </div>
                <p className="text-sm text-gray-500 mb-6">per month</p>

                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-white/80 text-sm"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-4 rounded-xl bg-[#333] text-white/40 font-bold text-sm cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : plan.tier === "enterprise" ? (
                  <Link
                    href="/contact"
                    className="w-full py-4 text-center bg-[#333] hover:bg-[#444] text-white rounded-xl transition-colors font-bold text-sm"
                  >
                    Contact Sales
                  </Link>
                ) : plan.tier === "trial" ? (
                  <Link
                    href="/trial/activate"
                    className="w-full py-4 text-center bg-[#333] hover:bg-[#444] text-white rounded-xl transition-colors font-bold text-sm"
                  >
                    Start Trial
                  </Link>
                ) : (
                  <Link
                    href={`/checkout?plan=${plan.tier}&cycle=monthly`}
                    className={`w-full py-4 text-center rounded-xl transition-all font-bold text-sm ${
                      plan.isFeatured
                        ? "bg-gradient-to-r from-[#f97316] to-[#a855f7] text-white hover:brightness-110 shadow-lg shadow-orange-500/20"
                        : "bg-[#333] hover:bg-[#444] text-white"
                    }`}
                  >
                    Upgrade Now
                  </Link>
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
