"use client";

import { format } from "date-fns";
import { motion } from "framer-motion";

export default function PointsHistory({ history, redemptions }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Points History */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📜</span> Points History
        </h3>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {history.length > 0 ? (
            history.map((record) => (
              <div
                key={record._id}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800"
              >
                <div>
                  <p className="text-gray-300 text-sm font-medium">
                    {record.reason}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {format(new Date(record.createdAt), "MMM d, yyyy • h:mm a")}
                  </p>
                </div>
                <div
                  className={`font-bold text-sm ${
                    record.points > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {record.points > 0 ? "+" : ""}
                  {record.points}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No history yet.</p>
          )}
        </div>
      </div>

      {/* Active Coupons / Redemptions */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>🎟️</span> My Coupons
        </h3>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {redemptions.length > 0 ? (
            redemptions.map((item) => (
              <div
                key={item._id}
                className="relative overflow-hidden p-4 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-lg border border-indigo-500/30 group"
              >
                {/* Dashed Border Effect */}
                <div className="absolute inset-0 rounded-lg border-2 border-dashed border-white/10 pointer-events-none" />

                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div>
                    <h4 className="text-white font-bold">
                      {item.reward?.title || "Unknown Reward"}
                    </h4>
                    <p className="text-indigo-300 text-xs mt-1">
                      Expires:{" "}
                      {item.expiresAt
                        ? format(new Date(item.expiresAt), "MMM d, yyyy")
                        : "Never"}
                    </p>
                  </div>
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded font-medium">
                    ACTIVE
                  </span>
                </div>

                <div className="mt-3 relative z-10 bg-black/30 p-2 rounded flex justify-between items-center group-hover:bg-black/50 transition-colors">
                  <code className="text-yellow-400 font-mono font-bold tracking-wider">
                    {item.code}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.code);
                      // Optional: Add small toast here
                    }}
                    className="text-gray-400 hover:text-white text-xs"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2 opacity-30">🕸️</div>
              <p className="text-gray-500">No active coupons.</p>
              <p className="text-gray-600 text-xs mt-1">
                Redeem points to get rewards!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
