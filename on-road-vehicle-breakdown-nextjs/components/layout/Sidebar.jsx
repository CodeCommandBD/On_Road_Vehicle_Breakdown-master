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
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/bookings", label: "My Bookings", icon: Calendar },
    { href: "/dashboard/profile", label: "My Profile", icon: User },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  garage: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/bookings", label: "Bookings", icon: Calendar },
    { href: "/dashboard/services", label: "My Services", icon: Wrench },
    { href: "/dashboard/profile", label: "Garage Profile", icon: User },
    { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
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
          "fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r transition-transform duration-300 lg:translate-x-0 lg:static lg:h-[calc(100vh-80px)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b lg:hidden">
            <span className="font-bold text-xl text-primary">Menu</span>
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-1 hover:bg-gray-100 rounded-md"
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
                        className={cn("w-5 h-5", isActive ? "text-primary" : "text-gray-400")}
                      />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
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
