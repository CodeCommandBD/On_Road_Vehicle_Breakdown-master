"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function RewardsCatalog({ rewards, userPoints, onRedeem }) {
  const t = useTranslations("Rewards"); // Assuming we'll add keys
  const [loadingId, setLoadingId] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);

  const handleRedeem = async (reward) => {
    if (userPoints < reward.pointsCost) return;

    setLoadingId(reward._id);
    try {
      const res = await axios.post("/api/rewards/redeem", {
        rewardId: reward._id,
      });

      if (res.data.success) {
        toast.success(res.data.message || "Reward redeemed successfully!");
        onRedeem(res.data.newBalance); // Update parent state
        setSelectedReward(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Redemption failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rewards.map((reward) => (
        <div
          key={reward._id}
          className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg hover:border-blue-500/50 transition-all group"
        >
          {/* Image Placeholder or Actual Image */}
          <div className="h-40 bg-gray-700 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-4xl">
              {reward.type === "service_discount" && "🔧"}
              {reward.type === "subscription_upgrade" && "⭐"}
              {reward.type === "gift_card" && "🎁"}
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-80" />

            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
              <span className="bg-blue-600/90 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                {reward.type.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-5">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              {reward.title}
            </h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
              {reward.description}
            </p>

            <div className="flex items-center justify-between mt-auto">
              <div className="text-yellow-400 font-bold flex items-center gap-1">
                <span>💎</span>
                <span>{reward.pointsCost}</span>
              </div>

              <button
                onClick={() => setSelectedReward(reward)}
                disabled={userPoints < reward.pointsCost}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  userPoints >= reward.pointsCost
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                {userPoints >= reward.pointsCost ? "Redeem" : "Locked"}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {selectedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">
                Confirm Redemption
              </h3>
              <p className="text-gray-300 text-sm mb-6">
                Are you sure you want to spend{" "}
                <span className="text-yellow-400 font-bold">
                  {selectedReward.pointsCost} points
                </span>{" "}
                to claim{" "}
                <span className="text-white font-semibold">
                  {selectedReward.title}
                </span>
                ?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedReward(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRedeem(selectedReward)}
                  disabled={loadingId === selectedReward._id}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 transition-all font-medium flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  {loadingId === selectedReward._id ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {rewards.length === 0 && (
        <div className="col-span-full py-12 text-center text-gray-500">
          No rewards available at the moment.
        </div>
      )}
    </div>
  );
}
