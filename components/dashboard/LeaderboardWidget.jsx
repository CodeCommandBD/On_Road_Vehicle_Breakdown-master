"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Star, User, Loader2, Award } from "lucide-react";
import axios from "axios";

export default function LeaderboardWidget({ role = "user" }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get("/api/user/leaderboard");
        if (res.data.success) {
          setData(
            role === "garage"
              ? res.data.leaderboards.garages
              : res.data.leaderboards.users
          );
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [role]);

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-orange-500 mb-2" />
        <p className="text-white/40 text-xs">Loading Leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E1E1E] border border-white/5 rounded-3xl overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Trophy className="text-orange-500" size={18} />
          {role === "garage" ? "Top Service Heroes" : "Top Contributors"}
        </h3>
        <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">
          Global
        </span>
      </div>

      <div className="p-2 relative z-10">
        {data.length === 0 ? (
          <div className="py-10 text-center opacity-40">
            <Star size={32} className="mx-auto mb-2" />
            <p className="text-sm">No rankings yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {data.map((item, idx) => (
              <div
                key={item._id}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors group/item"
              >
                <div className="w-8 flex justify-center">
                  {idx === 0 ? (
                    <Medal className="text-yellow-500" size={20} />
                  ) : idx === 1 ? (
                    <Medal className="text-slate-400" size={20} />
                  ) : idx === 2 ? (
                    <Medal className="text-amber-700" size={20} />
                  ) : (
                    <span className="text-xs font-bold text-white/20 italic">
                      #{idx + 1}
                    </span>
                  )}
                </div>

                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden shrink-0">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={18} className="text-white/40" />
                  )}
                  {idx === 0 && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-[#1E1E1E] animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate group-hover/item:text-orange-500 transition-colors">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-white/40 uppercase tracking-tighter">
                    Level {item.level} • {item.membershipTier}
                  </p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 font-black text-white group-hover/item:scale-110 transition-transform origin-right">
                    <span className="text-sm">{item.rewardPoints}</span>
                    <Award size={12} className="text-orange-500" />
                  </div>
                  <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
                    Points
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-white/5 border-t border-white/5">
        <button className="w-full py-2 rounded-xl text-[10px] font-bold text-white/40 hover:text-orange-500 transition-colors uppercase tracking-[0.2em]">
          View Full Leaderboard
        </button>
      </div>
    </div>
  );
}
