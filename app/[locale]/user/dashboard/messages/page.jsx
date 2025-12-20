"use client";

import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import ChatInterface from "@/components/dashboard/ChatInterface";
import { MessageSquare, ShieldCheck } from "lucide-react";

export default function MessagesPage() {
  const user = useSelector(selectUser);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-orange-500" />
            Messages
          </h1>
          <p className="text-white/60 mt-1">
            Chat with garages and support team
          </p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">
            Secure Chat
          </span>
        </div>
      </div>

      <ChatInterface userId={user._id} />
    </div>
  );
}
