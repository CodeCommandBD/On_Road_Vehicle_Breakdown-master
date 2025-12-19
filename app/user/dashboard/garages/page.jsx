"use client";

import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import LiveGarageTracker from "@/components/dashboard/LiveGarageTracker";
import { MapPin, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NearbyGaragesPage() {
  const user = useSelector(selectUser);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/user/dashboard"
            className="text-xs text-white/40 hover:text-orange-400 transition-colors flex items-center gap-1 mb-2 group"
          >
            <ChevronLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="text-orange-500" />
            Nearby Help Centers
          </h1>
          <p className="text-white/60 text-sm">
            Discover and contact the nearest garages available to help you.
          </p>
        </div>
      </div>

      {/* Live Tracker - Full Width */}
      <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <LiveGarageTracker user={user} />
      </div>

      {/* Info Card */}
      <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6">
        <h3 className="text-orange-500 font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
          💡 Pro Tip
        </h3>
        <p className="text-white/60 text-sm leading-relaxed">
          Use the <strong>"Detect Live Location"</strong> button on the map to
          get the most accurate results based on your current GPS coordinates.
          Ensure your browser's location permissions are enabled.
        </p>
      </div>
    </div>
  );
}
