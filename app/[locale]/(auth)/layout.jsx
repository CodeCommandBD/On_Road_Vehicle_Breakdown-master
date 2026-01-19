import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background Images/Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800"></div>
        <div className="absolute inset-0 bg-[url('/images/auth-pattern.svg')] opacity-5"></div>
        {/* Overlay */}
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
      </div>

      {/* Content */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white transition-all group backdrop-blur-xl shadow-2xl"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <Home className="w-4 h-4" />
        <span className="text-xs font-bold tracking-widest uppercase">
          Home
        </span>
      </Link>

      <div className="relative z-10 w-full flex justify-center">{children}</div>
    </div>
  );
}
