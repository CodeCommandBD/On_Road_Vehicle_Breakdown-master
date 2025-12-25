"use client";

import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import ChatInterface from "@/components/dashboard/ChatInterface";
import { MessageSquare, ShieldCheck } from "lucide-react";

export default function MechanicMessagesPage() {
  const user = useSelector(selectUser);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#020617] p-2 sm:p-8 pb-24 lg:pb-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
              <MessageSquare className="w-10 h-10 text-indigo-500" />
              Secure Comms
            </h1>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mt-1">
              Encrypted Channel • Operations Support
            </p>
          </div>
          <div className="hidden sm:flex bg-indigo-500/10 border border-indigo-500/20 px-6 py-3 rounded-2xl items-center gap-3 shadow-lg shadow-indigo-500/5">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">
              Authorized Access
            </span>
          </div>
        </div>

        <ChatInterface userId={user._id} />
      </div>
    </div>
  );
}
