"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import axiosInstance from "@/lib/axios";
import { useTranslations } from "next-intl";
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
  FileText,
  Mail,
  BarChart3,
  Zap,
  Crown,
  Package,
} from "lucide-react";

const getMenuItems = (t) => [
  { name: t("dashboard"), href: "/admin/dashboard", icon: LayoutDashboard },
  { name: t("users"), href: "/admin/users", icon: Users },
  { name: t("garages"), href: "/admin/garages", icon: Car },
  { name: t("bookings"), href: "/admin/bookings", icon: CalendarDays },
  { name: t("payments"), href: "/admin/payments", icon: DollarSign },
  { name: t("reviews"), href: "/admin/reviews", icon: Star },
  { name: t("services"), href: "/admin/services", icon: Settings },
  {
    name: t("analytics"),
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    name: t("serviceAnalytics"),
    href: "/admin/services/analytics",
    icon: BarChart3,
  },
  { name: t("featureUsage"), href: "/admin/features/usage", icon: Zap },
  { name: t("plans"), href: "/admin/plans", icon: Package },
  {
    name: t("subscriptions"),
    href: "/admin/dashboard/subscriptions",
    icon: Crown,
  },
  { name: t("contracts"), href: "/admin/contracts", icon: FileText },
  {
    name: t("inquiries"),
    href: "/admin/inquiries",
    icon: Mail,
    badge: "inquiries",
  },
  {
    name: t("support"),
    href: "/admin/support",
    icon: MessageSquareWarning,
    badge: "support",
  },
  {
    name: t("messages"),
    href: "/admin/messages",
    icon: MessageSquare,
    badge: "messages",
  },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const t = useTranslations("AdminNav");
  const pathname = usePathname();
  const router = useRouterWithLoading(true); // i18n routing
  const dispatch = useDispatch();
  const menuItems = getMenuItems(t);
  const [counts, setCounts] = useState({
    inquiries: 0,
    support: 0,
    messages: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await axiosInstance.get("/admin/counts");
        if (response.data.success) {
          // Extract counts from new API structure
          const data = response.data.data;
          setCounts({
            inquiries: data.inquiries || 0,
            support: data.support || 0,
            messages: 0, // Not available in current API
          });
        }
      } catch (error) {
        console.error("Failed to fetch counts:", error);
      }
    };

    fetchCounts();
    // Poll every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reset counters when user visits the page
  useEffect(() => {
    setCounts((prev) => {
      const newCounts = { ...prev };

      // Reset counter for current page
      if (pathname === "/admin/inquiries") {
        newCounts.inquiries = 0;
      } else if (pathname === "/admin/support") {
        newCounts.support = 0;
      } else if (pathname === "/admin/messages") {
        newCounts.messages = 0;
      }

      return newCounts;
    });
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
      dispatch(logout());
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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
        className={`fixed top-0 left-0 h-full w-72 bg-[#020617] border-r border-[#333] z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
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
            {t("mainMenu")}
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;

            // Find the best match for the current path
            // This handles nested routes like /admin/services and /admin/services/analytics
            // by prioritizing the longest matching href
            const activeItem = menuItems
              .filter(
                (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
              )
              .sort((a, b) => b.href.length - a.href.length)[0];

            // Fallback for direct matches if the strict slash check misses (e.g. simplified startsWith for non-nested)
            // But actually, simpler logic:
            // Just find specific active item by sorting all matches by length
            const exactActiveItem = menuItems
              .filter((i) => pathname.startsWith(i.href))
              .sort((a, b) => b.href.length - a.href.length)[0];

            const isActive = exactActiveItem?.href === item.href;

            const badgeCount = item.badge ? counts[item.badge] : 0;

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
                <span className="font-medium flex-1">{item.name}</span>

                {/* Badge Counter */}
                {badgeCount > 0 && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}

                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20"></div>
                )}
              </Link>
            );
          })}

          <div className="pt-8 mt-8 border-t border-[#222]">
            <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4 px-3">
              {t("settings")}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3.5 text-white/60 hover:bg-red-500/10 hover:text-red-500 w-full rounded-xl transition-all duration-200 text-left group"
            >
              <LogOut size={20} />
              <span className="font-medium">{t("logout")}</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
