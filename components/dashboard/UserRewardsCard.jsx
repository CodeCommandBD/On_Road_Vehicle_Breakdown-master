"use client";

import { Award, TrendingUp, Gift } from "lucide-react";

export default function UserRewardsCard({ user, stats }) {
  const points = stats?.points || 0;
  const tier = user?.membershipTier || "free";

  const tierConfig = {
    free: {
      name: "Free",
      color: "from-gray-500 to-gray-600",
      nextTier: "Basic",
      pointsNeeded: 500,
      benefits: ["Basic support", "Standard booking"],
    },
    basic: {
      name: "Basic",
      color: "from-blue-500 to-blue-600",
      nextTier: "Standard",
      pointsNeeded: 1500,
      benefits: ["Priority support", "5% cashback", "Faster response"],
    },
    standard: {
      name: "Standard",
      color: "from-purple-500 to-purple-600",
      nextTier: "Premium",
      pointsNeeded: 3000,
      benefits: ["24/7 support", "10% cashback", "Premium garages"],
    },
    premium: {
      name: "Premium",
      color: "from-yellow-400 to-orange-500",
      nextTier: null,
      pointsNeeded: null,
      benefits: [
        "VIP support",
        "15% cashback",
        "Exclusive offers",
        "Free towing",
      ],
    },
  };

  const currentTier = tierConfig[tier];
  const progress = currentTier.pointsNeeded
    ? Math.min((points / currentTier.pointsNeeded) * 100, 100)
    : 100;

  return (
    <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Award className="w-5 h-5" />
          Rewards & Benefits
        </h3>
      </div>

      {/* Points Display */}
      <div
        className={`bg-gradient-to-r ${currentTier.color} rounded-xl p-6 mb-6 shadow-lg`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/80 text-sm mb-1">Your Points</p>
            <h2 className="text-4xl font-bold text-white">{points}</h2>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Gift className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Tier Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-semibold">
            {currentTier.name} Member
          </span>
          {currentTier.nextTier && (
            <span className="text-white/70 text-sm flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {currentTier.pointsNeeded - points} to {currentTier.nextTier}
            </span>
          )}
        </div>
      </div>

      {/* Progress to Next Tier */}
      {currentTier.nextTier && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/60">Next Tier Progress</span>
            <span className="text-white font-semibold">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${currentTier.color} transition-all duration-500 rounded-full`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Benefits */}
      <div>
        <p className="text-white/60 text-sm mb-3">Current Benefits</p>
        <div className="space-y-2">
          {currentTier.benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-white/80 text-sm"
            >
              <div
                className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${currentTier.color}`}
              ></div>
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      {currentTier.nextTier && (
        <button className="w-full mt-6 py-3 bg-gradient-orange text-white font-semibold rounded-xl hover:shadow-glow-orange transition-all scale-hover">
          Upgrade to {currentTier.nextTier}
        </button>
      )}
    </div>
  );
}
