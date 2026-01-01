"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import RewardsCatalog from "@/components/rewards/RewardsCatalog";
import PointsHistory from "@/components/rewards/PointsHistory";

export default function RewardsPage() {
  const [data, setData] = useState({
    userPoints: 0,
    history: [],
    redemptions: [],
    rewards: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("catalog"); // catalog | history

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch user data (includes points)
      const userRes = await axios.get("/api/profile");
      // Fetch history & redemptions
      const historyRes = await axios.get("/api/user/rewards/history");
      // Fetch rewards catalog
      const rewardsRes = await axios.get("/api/rewards");

      setData({
        userPoints: userRes.data.user?.rewardPoints || 0,
        history: historyRes.data.history || [],
        redemptions: historyRes.data.redemptions || [],
        rewards: rewardsRes.data.rewards || [],
      });
    } catch (error) {
      console.error("Failed to fetch rewards data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRedemptionComplete = (newBalance) => {
    setData((prev) => ({ ...prev, userPoints: newBalance }));
    fetchData(); // Refresh history and coupons
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header / Wallet Card */}
        <div className="mb-8 p-8 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 border border-blue-700/30 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
                Rewards Center
              </h1>
              <p className="text-blue-200">
                Earn points and unlock exclusive benefits.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md">
              <div className="text-right">
                <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider">
                  My Balance
                </p>
                <p className="text-4xl font-bold text-yellow-400 tabular-nums">
                  {data.userPoints.toLocaleString()}
                  <span className="text-lg text-yellow-500/80 ml-1">pts</span>
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-500/20 rounded-full flex items-center justify-center text-2xl border border-yellow-500/50">
                💎
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-800/50 p-1 rounded-lg w-fit border border-gray-700">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "catalog"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Rewards Catalog
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "history"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            My Coupons & History
          </button>
        </div>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "catalog" ? (
            <RewardsCatalog
              rewards={data.rewards}
              userPoints={data.userPoints}
              onRedeem={handleRedemptionComplete}
            />
          ) : (
            <PointsHistory
              history={data.history}
              redemptions={data.redemptions}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
