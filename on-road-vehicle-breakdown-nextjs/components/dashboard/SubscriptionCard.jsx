"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Calendar,
  Zap,
  TrendingUp,
  X,
  Info,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function SubscriptionCard() {
  const router = useRouter();
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
      basic: "from-blue-500 to-blue-600",
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
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getServiceCallsRemaining = () => {
    if (!subscription || !subscription.planId) return "N/A";
    const limit = subscription.planId.limits?.serviceCalls || 0;
    const used = subscription.usage?.serviceCallsUsed || 0;

    if (limit === -1) return "Unlimited";
    return `${Math.max(0, limit - used)} / ${limit}`;
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-2xl p-8 shadow-xl animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No Active Subscription
            </h3>
            <p className="text-white/80">
              Subscribe to unlock premium features and 24/7 support
            </p>
          </div>
          <Crown className="w-12 h-12 text-yellow-300" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <Zap className="w-6 h-6 text-yellow-300 mb-2" />
            <p className="text-white/80 text-sm">24/7 Support</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <CheckCircle className="w-6 h-6 text-green-300 mb-2" />
            <p className="text-white/80 text-sm">Priority Service</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <TrendingUp className="w-6 h-6 text-blue-300 mb-2" />
            <p className="text-white/80 text-sm">Unlimited Calls</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href="/trial/activate"
            className="flex-1 bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all duration-300 text-center"
          >
            Start Free Trial
          </Link>
          <Link
            href="/pricing"
            className="flex-1 bg-white/20 backdrop-blur text-white px-6 py-3 rounded-lg font-bold hover:bg-white/30 transition-all duration-300 text-center"
          >
            View Plans
          </Link>
        </div>
      </div>
    );
  }

  const plan = subscription.planId;
  const daysRemaining = getDaysRemaining(subscription.endDate);
  const isExpiringSoon = daysRemaining <= 7;
  const isTrial = subscription.status === "trial";

  return (
    <>
      <div
        className={`bg-gradient-to-br ${getPlanColor(
          plan.tier
        )} rounded-2xl p-8 shadow-2xl relative overflow-hidden`}
      >
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-3xl font-bold text-white">{plan.name}</h3>
                {plan.isFeatured && (
                  <span className="bg-yellow-400 text-gray-900 text-xs px-2 py-1 rounded-full font-bold">
                    ⭐ Popular
                  </span>
                )}
                {isTrial && (
                  <span className="bg-purple-400 text-white text-xs px-2 py-1 rounded-full font-bold">
                    Trial
                  </span>
                )}
              </div>
              <p className="text-white/80">{plan.description}</p>
            </div>
            <Crown className="w-12 h-12 text-yellow-300" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Service Calls */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-300" />
                <p className="text-white/70 text-sm">Service Calls</p>
              </div>
              <p className="text-white text-2xl font-bold">
                {getServiceCallsRemaining()}
              </p>
            </div>

            {/* Days Remaining */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-300" />
                <p className="text-white/70 text-sm">Days Remaining</p>
              </div>
              <p
                className={`text-2xl font-bold ${
                  isExpiringSoon ? "text-red-300" : "text-white"
                }`}
              >
                {daysRemaining} days
              </p>
            </div>

            {/* Billing Cycle */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-300" />
                <p className="text-white/70 text-sm">Billing</p>
              </div>
              <p className="text-white text-2xl font-bold capitalize">
                {subscription.billingCycle}
              </p>
            </div>
          </div>

          {/* Renewal Date */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">
                  {isTrial ? "Trial Expires" : "Next Billing Date"}
                </p>
                <p className="text-white font-semibold">
                  {formatDate(subscription.endDate)}
                </p>
              </div>
              {isExpiringSoon && (
                <div className="flex items-center gap-2 bg-red-500/20 px-3 py-2 rounded-lg">
                  <Info className="w-5 h-5 text-red-300" />
                  <span className="text-red-200 text-sm font-semibold">
                    Expires Soon!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {isTrial ? (
              <Link
                href="/pricing"
                className="flex-1 bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all duration-300 text-center"
              >
                Upgrade to Premium
              </Link>
            ) : (
              <>
                <Link
                  href="/pricing"
                  className="flex-1 bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all duration-300 text-center"
                >
                  Upgrade Plan
                </Link>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1 bg-white/20 backdrop-blur text-white px-6 py-3 rounded-lg font-bold hover:bg-white/30 transition-all duration-300"
                >
                  Cancel Subscription
                </button>
              </>
            )}
            <Link
              href="/user/billing"
              className="sm:flex-initial bg-white/20 backdrop-blur text-white px-6 py-3 rounded-lg font-bold hover:bg-white/30 transition-all duration-300 text-center"
            >
              View Billing
            </Link>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-white">
                Cancel Subscription?
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to cancel your subscription? You'll lose
              access to premium features at the end of your current billing
              period.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-600 transition-all duration-300"
              >
                Keep Subscription
              </button>
              <button
                onClick={() => {
                  // TODO: Implement cancel API call
                  alert("Cancel functionality to be implemented");
                  setShowCancelModal(false);
                }}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-all duration-300"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
