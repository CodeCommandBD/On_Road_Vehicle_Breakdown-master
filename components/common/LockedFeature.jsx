import Link from "next/link";
import { Lock, Crown } from "lucide-react";

export default function LockedFeature({
  title = "Premium Feature",
  description = "Upgrade your plan to access this exclusive feature.",
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
      <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
        <Lock className="w-10 h-10 text-orange-500" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-white/60 max-w-md mb-8">{description}</p>

      <Link
        href="/garage/dashboard/subscription"
        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-orange-500/25"
      >
        <Crown className="w-5 h-5" />
        Upgrade to Pro
      </Link>
    </div>
  );
}
