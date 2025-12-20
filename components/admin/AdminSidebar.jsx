"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  CalendarDays,
  DollarSign,
  Star,
  Settings,
  MessageSquareWarning,
  MessageSquare,
  LogOut,
  X,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Garages", href: "/admin/garages", icon: Car },
  { name: "Bookings", href: "/admin/bookings", icon: CalendarDays },
  { name: "Payments", href: "/admin/payments", icon: DollarSign },
  { name: "Reviews", href: "/admin/reviews", icon: Star },
  { name: "Services", href: "/admin/services", icon: Settings },
  { name: "Support", href: "/admin/support", icon: MessageSquareWarning },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#0a0a0a] border-r border-[#333] z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-[#222]">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FF532D] flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
              A
            </div>
            <span className="text-xl font-bold text-white tracking-wide">
              Admin<span className="text-[#FF532D]">Panel</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-white/50 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-6 space-y-2 overflow-y-auto h-[calc(100vh-80px)]">
          <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4 px-3">
            Main Menu
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? "bg-gradient-to-r from-[#FF532D] to-[#FF7E62] text-white shadow-lg shadow-orange-500/20 translate-x-1"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => onClose && window.innerWidth < 1024 && onClose()}
              >
                <Icon
                  size={20}
                  className={`${
                    isActive
                      ? "text-white"
                      : "text-white/60 group-hover:text-white transition-colors"
                  }`}
                />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20"></div>
                )}
              </Link>
            );
          })}

          <div className="pt-8 mt-8 border-t border-[#222]">
            <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4 px-3">
              Settings
            </div>
            <button className="flex items-center gap-3 px-4 py-3.5 text-white/60 hover:bg-red-500/10 hover:text-red-500 w-full rounded-xl transition-all duration-200 text-left group">
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
