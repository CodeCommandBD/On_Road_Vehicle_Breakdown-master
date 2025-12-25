"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useSelector, useDispatch } from "react-redux";
import {
  LayoutDashboard,
  Calendar,
  Wrench,
  User,
  Users,
  Settings,
  LogOut,
  X,
  CreditCard,
  MessageSquare,
  Activity,
  BrainCircuit,
  LifeBuoy,
  TrendingUp,
  Webhook,
  FileText,
  Heart,
} from "lucide-react";
import {
  selectSidebarOpen,
  setSidebarOpen,
  toggleSidebar,
} from "@/store/slices/uiSlice";
import {
  selectUserRole,
  selectUser,
  logout,
  selectFavorites,
} from "@/store/slices/authSlice";
import { cn } from "@/lib/utils/helpers";

export default function Sidebar() {
  const t = useTranslations("Navigation");
  const commonT = useTranslations("Common");
  const pathname = usePathname();
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(selectSidebarOpen);
  const role = useSelector(selectUserRole) || "user";
  const user = useSelector(selectUser);
  const favorites = useSelector(selectFavorites);

  // Debug: Log user membership tier
  console.log("Sidebar - User data:", {
    hasUser: !!user,
    membershipTier: user?.membershipTier,
    isTeamMember: user?.isTeamMember,
    email: user?.email,
  });

  const sidebarLinks = {
    user: [
      { href: "/user/dashboard", label: t("dashboard"), icon: LayoutDashboard },
      {
        href: "/user/dashboard/analytics",
        label: "Analytics",
        icon: TrendingUp,
        locked:
          user?.membershipTier !== "premium" &&
          user?.membershipTier !== "enterprise",
      },
      {
        href: "/user/dashboard/integrations",
        label: "CRM / Integrations",
        icon: Webhook,
        locked:
          user?.membershipTier !== "premium" &&
          user?.membershipTier !== "enterprise",
      },
      {
        href: "/user/dashboard/team",
        label: "Team Management",
        icon: Users,
        locked:
          user?.membershipTier !== "premium" &&
          user?.membershipTier !== "enterprise" &&
          !user?.isTeamMember,
      },
      {
        href: "/user/dashboard/bookings",
        label: t("bookings"),
        icon: Calendar,
      },
      {
        href: "/user/dashboard/favorites",
        label: "Favorite Garages",
        icon: Heart,
      },
      {
        href: "/user/dashboard/predictive-maintenance",
        label: t("aiMaintenance") || "AI Diagnosis",
        icon: BrainCircuit,
      },
      {
        href: "/user/dashboard/automation",
        label: "Automation",
        icon: Activity,
        locked:
          user?.membershipTier === "free" || user?.membershipTier === "trial",
      },
      { href: "/user/dashboard/profile", label: t("profile"), icon: User },
      {
        href: "/user/dashboard/messages",
        label: t("messages"),
        icon: MessageSquare,
      },
      {
        href: "/user/dashboard/reports",
        label: "Reports",
        icon: FileText,
        locked:
          user?.membershipTier !== "premium" &&
          user?.membershipTier !== "enterprise",
      },
      {
        href: "/user/dashboard/support",
        label: t("support") || "Help & Support",
        icon: LifeBuoy,
      },
      {
        href: "/user/dashboard/settings",
        label: t("settings"),
        icon: Settings,
      },
    ],
    garage: [
      {
        href: "/garage/dashboard",
        label: t("dashboard"),
        icon: LayoutDashboard,
      },
      {
        href: "/garage/dashboard/bookings",
        label: t("bookings"),
        icon: Calendar,
      },
      {
        href: "/garage/dashboard/services",
        label: t("services"),
        icon: Wrench,
      },
      { href: "/garage/dashboard/profile", label: t("profile"), icon: User },
      {
        href: "/garage/dashboard/navigation",
        label: t("missionControl"),
        icon: Activity,
      },
      {
        href: "/garage/dashboard/messages",
        label: t("messages"),
        icon: MessageSquare,
      },
      {
        href: "/garage/dashboard/analytics",
        label: "Analytics",
        icon: TrendingUp,
        locked:
          user?.garage?.membershipTier !== "premium" &&
          user?.garage?.membershipTier !== "enterprise",
      },
      {
        href: "/garage/dashboard/team",
        label: "Team Management",
        icon: Users,
        locked:
          user?.garage?.membershipTier !== "premium" &&
          user?.garage?.membershipTier !== "enterprise",
      },
      {
        href: "/garage/dashboard/subscription",
        label: t("subscription"),
        icon: CreditCard,
      },
      {
        href: "/garage/dashboard/settings",
        label: t("settings"),
        icon: Settings,
      },
    ],
    admin: [
      {
        href: "/admin/dashboard",
        label: t("dashboard"),
        icon: LayoutDashboard,
      },
      { href: "/admin/users", label: "Users", icon: User },
      { href: "/admin/garages", label: "Garages", icon: Wrench },
      { href: "/admin/bookings", label: t("bookings"), icon: Calendar },
      { href: "/admin/settings", label: t("settings"), icon: Settings },
    ],
  };

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
            <span className="font-bold text-xl text-orange-500">
              {t("menu")}
            </span>
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
                const isActive =
                  link.href.endsWith("/dashboard") ||
                  link.href.endsWith("/dashboard/")
                    ? pathname === link.href
                    : pathname.startsWith(link.href);
                return (
                  <li key={link.href}>
                    {link.locked ? (
                      <div
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-white/40 cursor-not-allowed group"
                        )}
                        title="Upgrade to unlock"
                      >
                        <div className="flex items-center gap-3">
                          <link.icon className="w-5 h-5" />
                          {link.label}
                        </div>
                        <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
                          🔒
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all group",
                          isActive
                            ? "bg-orange-500/10 text-orange-500 shadow-[0_4px_12px_rgba(249,115,22,0.1)]"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        )}
                        onClick={() => dispatch(setSidebarOpen(false))}
                      >
                        <link.icon
                          className={cn(
                            "w-5 h-5",
                            isActive
                              ? "text-orange-500"
                              : "text-white/40 group-hover:text-white transition-colors"
                          )}
                        />
                        {link.label}
                        {link.href === "/user/dashboard/favorites" &&
                          favorites.length > 0 && (
                            <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-in zoom-in-50">
                              {favorites.length}
                            </span>
                          )}
                      </Link>
                    )}
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
              {t("logout")}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
