"use client";

import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import ChatInterface from "@/components/dashboard/ChatInterface";
import { MessageSquare, ShieldAlert } from "lucide-react";

export default function AdminMessagesPage() {
  const user = useSelector(selectUser);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-[#FF532D]" />
            Admin Supervision
          </h1>
          <p className="text-white/60 mt-1">
            Official support channel for users and garages.
          </p>
        </div>
        <div className="bg-[#FF532D]/10 border border-[#FF532D]/20 px-4 py-2 rounded-xl flex items-center gap-2 w-fit">
          <ShieldAlert className="w-4 h-4 text-[#FF532D]" />
          <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">
            Verified Support
          </span>
        </div>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden shadow-2xl">
        <ChatInterface userId={user._id} />
      </div>
    </div>
  );
}
