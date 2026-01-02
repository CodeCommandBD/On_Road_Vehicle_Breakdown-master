"use client";

import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, Link } from "@/i18n/routing";
import { usePathname } from "@/i18n/routing";
import {
  selectIsAuthenticated,
  selectAuthLoading,
  selectUser,
  updateUser,
} from "@/store/slices/authSlice";
import axios from "axios";
import {
  Home,
  MessageSquare,
  User,
  MapPin,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  Loader2,
} from "lucide-react";
import {
  selectUnreadNotificationsCount,
  setUnreadNotificationsCount,
} from "@/store/slices/uiSlice";

export default function MechanicLayout({ children }) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouterWithLoading(true); // i18n routing
  const unreadCount = useSelector(selectUnreadNotificationsCount);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const user = useSelector(selectUser);

  // Sync profile data on mount
  useEffect(() => {
    const syncProfile = async () => {
      try {
        const res = await axios.get("/api/profile");
        if (res.data.success) {
          dispatch(updateUser(res.data.user));
        }
      } catch (error) {
        console.error("Mechanic layout - Profile sync failed:", error);
      }
    };

    if (isAuthenticated) {
      syncProfile();
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!isLoading && user && user.role !== "mechanic") {
      // Redirect based on role
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (
        user.role === "garage" ||
        user.membershipTier === "garage_pro" ||
        user.membershipTier === "garage_basic"
      ) {
        router.push("/garage/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const notifyRef = useRef(null);

  const isActive = (path) => pathname === path;

  // Bottom Navigation Items (Mobile)
  // Fetch current notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("/api/notifications");
        if (res.data.success) {
          setNotifications(res.data.notifications);
          dispatch(setUnreadNotificationsCount(res.data.unreadCount));
        }
      } catch (err) {
        console.error("Failed to fetch notifications in mechanic layout:", err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setIsNotifyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markNotifyRead = async () => {
    try {
      await axios.patch("/api/notifications", { markAllAsRead: true });
      dispatch(setUnreadNotificationsCount(0));
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const navItems = [
    { icon: Home, label: "Home", href: "/mechanic/dashboard" },
    { icon: MapPin, label: "Jobs", href: "/mechanic/dashboard/jobs" },
    {
      icon: MessageSquare,
      label: "Messages",
      href: "/mechanic/dashboard/messages",
    },
    { icon: Settings, label: "Settings", href: "/mechanic/dashboard/settings" },
  ];

  if (isLoading || !isAuthenticated || (user && user.role !== "mechanic")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col">
      {/* Top Header */}
      <header className="bg-[#020617] border-b border-white/5 sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Hamburger hidden as per request */}
          {/* Hamburger hidden as per request */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-white tracking-tight">
              C<span className="text-orange-500">od</span>eMand
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={notifyRef}>
            <button
              onClick={() => {
                setIsNotifyOpen(!isNotifyOpen);
                if (!isNotifyOpen && unreadCount > 0) markNotifyRead();
              }}
              className="relative p-2 hover:bg-white/5 rounded-full transition-colors text-slate-300 hover:text-white"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-[#020617]"></span>
              )}
            </button>

            {isNotifyOpen && (
              <div className="absolute top-12 right-0 w-80 bg-[#111] border border-white/5 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    System Alerts
                  </h4>
                  <span className="text-[10px] text-red-500 uppercase font-black tracking-widest">
                    {unreadCount} NEW
                  </span>
                </div>
                <div className="max-h-[24rem] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => {
                          if (n.link) router.push(n.link);
                          setIsNotifyOpen(false);
                        }}
                        className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <p className="text-xs font-bold text-white mb-1 group-hover:text-indigo-400">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[9px] text-slate-600 mt-2 font-bold uppercase tracking-tighter">
                          {new Date(n.createdAt).toLocaleDateString()} AT{" "}
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-sm text-slate-500 font-medium italic">
                        No critical mission alerts.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 lg:pb-0 lg:pl-64 container mx-auto p-4">
        {children}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#020617] border-t border-white/5 z-30 flex justify-around items-center py-2 pb-safe lg:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              isActive(item.href)
                ? "text-orange-500 bg-orange-500/10"
                : "text-slate-400 hover:text-white"
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
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-[#020617] border-r border-white/5 flex-col pt-20">
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.href)
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
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
