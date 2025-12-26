"use client";

import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import ChatInterface from "@/components/dashboard/ChatInterface";
import LockedFeature from "@/components/common/LockedFeature";
import { MessageSquare, ShieldCheck } from "lucide-react";

export default function GarageMessagesPage() {
  const user = useSelector(selectUser);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-orange-500" />
            Garage Communications
          </h1>
          <p className="text-white/60 mt-1">
            Connect with your customers and the support team in real-time.
          </p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl flex items-center gap-2 w-fit">
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">
            Verified Channel
          </span>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        {(user?.garage?.membershipTier === "premium" ||
          user?.garage?.membershipTier === "enterprise" ||
          user?.garage?.membershipTier === "garage_pro") &&
        (!user?.garage?.membershipExpiry ||
          new Date(user.garage.membershipExpiry) > new Date()) ? (
          <ChatInterface userId={user._id} />
        ) : (
          <LockedFeature
            title="Direct Customer Chat"
            description="Engage with your customers in real-time to build trust and close more bookings. Upgrade to Garage Pro to unlock this feature."
          />
        )}
      </div>
    </div>
  );
}
