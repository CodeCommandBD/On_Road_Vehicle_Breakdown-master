"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  LayoutDashboard,
  Calendar,
  Wrench,
  User,
  Settings,
  LogOut,
  X,
  CreditCard,
  MessageSquare,
  Activity,
} from "lucide-react";
import {
  selectSidebarOpen,
  setSidebarOpen,
  toggleSidebar,
} from "@/store/slices/uiSlice";
import { selectUserRole, logout } from "@/store/slices/authSlice";
import { cn } from "@/lib/utils/helpers";

const sidebarLinks = {
  user: [
    { href: "/user/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/user/dashboard/bookings", label: "My Bookings", icon: Calendar },
    { href: "/user/dashboard/profile", label: "My Profile", icon: User },
    {
      href: "/user/dashboard/messages",
      label: "Messages",
      icon: MessageSquare,
    },
    { href: "/user/dashboard/settings", label: "Settings", icon: Settings },
  ],
  garage: [
    { href: "/garage/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/garage/dashboard/bookings", label: "Bookings", icon: Calendar },
    { href: "/garage/dashboard/services", label: "My Services", icon: Wrench },
    { href: "/garage/dashboard/profile", label: "Garage Profile", icon: User },
    {
      href: "/garage/dashboard/navigation",
      label: "Mission Control",
      icon: Activity,
    },
    {
      href: "/garage/dashboard/messages",
      label: "Messages",
      icon: MessageSquare,
    },
    {
      href: "/garage/dashboard/subscription",
      label: "Subscription",
      icon: CreditCard,
    },
    { href: "/garage/dashboard/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: User },
    { href: "/admin/garages", label: "Garages", icon: Wrench },
    { href: "/admin/bookings", label: "Bookings", icon: Calendar },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(selectSidebarOpen);
  const role = useSelector(selectUserRole) || "user";

  const links = sidebarLinks[role] || sidebarLinks.user;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      dispatch(logout());
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => dispatch(setSidebarOpen(false))}
      />

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-[#1E1E1E] border-r border-white/10 transition-transform duration-300 lg:static lg:translate-x-0 lg:z-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 lg:hidden">
            <span className="font-bold text-xl text-orange-500">Menu</span>
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-1 hover:bg-white/10 rounded-md text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      onClick={() => dispatch(setSidebarOpen(false))}
                    >
                      <link.icon
                        className={cn(
                          "w-5 h-5",
                          isActive ? "text-primary" : "text-gray-400"
                        )}
                      />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg font-medium text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
