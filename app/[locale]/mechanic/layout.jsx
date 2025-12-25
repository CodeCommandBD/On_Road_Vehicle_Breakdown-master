"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  User,
  MapPin,
  LogOut,
  Menu,
  X,
  Bell,
} from "lucide-react";

export default function MechanicLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (path) => pathname === path;

  // Bottom Navigation Items (Mobile)
  const navItems = [
    { icon: Home, label: "Home", href: "/mechanic/dashboard" },
    { icon: MapPin, label: "Jobs", href: "/mechanic/dashboard/jobs" }, // Dedicated jobs list
    { icon: MessageSquare, label: "Chat", href: "/mechanic/dashboard/chat" },
    { icon: User, label: "Profile", href: "/mechanic/dashboard/profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full lg:hidden"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <img
            src="/logo.png"
            alt="Logo"
            className="h-8 w-auto object-contain"
            onError={(e) => (e.target.style.display = "none")}
          />
          <span className="font-bold text-lg text-primary">Mechanic</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 hover:bg-gray-100 rounded-full">
            <Bell className="w-6 h-6 text-gray-700" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 lg:pb-0 lg:pl-64 container mx-auto p-4">
        {children}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex justify-around items-center py-2 pb-safe lg:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              isActive(item.href)
                ? "text-primary bg-orange-50"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <item.icon
              className={`w-6 h-6 ${isActive(item.href) ? "fill-current" : ""}`}
            />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Sidebar for Desktop (Hidden on Mobile) */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex-col pt-20">
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.href)
                  ? "bg-primary text-white shadow-lg shadow-orange-200"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}
