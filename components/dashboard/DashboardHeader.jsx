"use client";

import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  Breadcrumb,
  Award,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleSidebar,
  setSearchTerm,
  selectSearchTerm,
  selectUnreadNotificationsCount,
  setUnreadNotificationsCount,
} from "@/store/slices/uiSlice";
import { selectUser, logout, updateUser } from "@/store/slices/authSlice";
import BreadcrumbNav from "./Breadcrumb";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { cn } from "@/lib/utils/helpers";
import RewardsInfoModal from "./RewardsInfoModal";

export default function DashboardHeader() {
  const t = useTranslations("Common");
  const navT = useTranslations("Navigation");
  const dashT = useTranslations("Dashboard");
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector(selectUser);
  const searchTerm = useSelector(selectSearchTerm);
  const unreadCount = useSelector(selectUnreadNotificationsCount);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const profileRef = useRef(null);
  const notifyRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("/api/notifications");
        if (res.data.success) {
          setNotifications(res.data.notifications);
          dispatch(setUnreadNotificationsCount(res.data.unreadCount));
          if (res.data.notifications.length > 0) {
            console.log(
              "🔔 Notifications synced:",
              res.data.notifications.length
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    const fetchPoints = async () => {
      try {
        const res = await axios.get("/api/user/points");
        if (res.data.success) {
          dispatch(
            updateUser({
              rewardPoints: res.data.rewardPoints,
              level: res.data.level,
            })
          );
        }
      } catch (err) {
        console.error("Failed to fetch points in header:", err);
      }
    };

    fetchNotifications();
    if (user?.role !== "admin") fetchPoints();

    const interval = setInterval(() => {
      fetchNotifications();
      if (user?.role !== "admin") fetchPoints();
    }, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [dispatch, user?.role]);

  // Click outside handlers
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setIsProfileOpen(false);
      if (notifyRef.current && !notifyRef.current.contains(e.target))
        setIsNotifyOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  console.log("🔔 NOTIFICATIONS STATE IN HEADER:", notifications);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      dispatch(logout());
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const markNotifyRead = async () => {
    try {
      await axios.patch("/api/notifications", { markAllAsRead: true });
      dispatch(setUnreadNotificationsCount(0));
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  return (
    <header className="bg-[#1E1E1E] border-b border-white/10 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Hamburger Menu - Visible on mobile/tablet */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Breadcrumbs - Hidden on small mobile, visible on tablet+ */}
        <div className="hidden sm:block">
          <BreadcrumbNav />
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        {/* Search - Hidden on mobile */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder={t("search")}
            value={searchTerm}
            onChange={(e) => dispatch(setSearchTerm(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 w-48 lg:w-64 transition-all"
          />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Reward Points - Visible on tablet and desktop */}
          {user?.role !== "admin" && (
            <div
              onClick={() => setIsRewardsModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl mr-2 group cursor-pointer transition-all hover:border-orange-500/40 hover:scale-105 active:scale-95"
            >
              <Award className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-white">
                {user?.rewardPoints || 0}
              </span>
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">
                Pts
              </span>
            </div>
          )}

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifyRef}>
            <button
              onClick={() => {
                setIsNotifyOpen(!isNotifyOpen);
                if (!isNotifyOpen && unreadCount > 0) markNotifyRead();
              }}
              className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#1E1E1E]"></span>
              )}
            </button>

            {isNotifyOpen && (
              <div className="absolute top-12 right-0 w-80 bg-[#1E1E1E] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <h4 className="text-sm font-bold text-white">
                    {t("notifications")}
                  </h4>
                  <span className="text-[10px] text-orange-500 uppercase font-bold tracking-wider">
                    {unreadCount} {navT("new")}
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto scrollbar-hide">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => {
                          console.log("🔔 Notification Clicked:", n);
                          if (n.link) {
                            console.log("🚀 Redirecting to:", n.link);
                            router.push(n.link);
                          } else {
                            console.log("⚠️ No link found in notification");
                          }
                          setIsNotifyOpen(false);
                        }}
                        className="p-4 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <p className="text-xs font-bold text-white mb-1 group-hover:text-orange-500">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-white/60 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[9px] text-white/30 mt-2">
                          {new Date(n.createdAt).toLocaleDateString()} at{" "}
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-sm text-white/40">
                        {t("noNotifications")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block"></div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <div
              className="flex items-center gap-3 pl-2 group cursor-pointer"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="hidden lg:block text-right">
                <p className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors">
                  {user?.name || dashT("welcome", { name: "Guest" })}
                </p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest leading-none font-bold">
                  {user?.role || navT("member")}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-[1px]">
                <div className="w-full h-full bg-[#1E1E1E] rounded-xl flex items-center justify-center text-white overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-orange-500" />
                  )}
                </div>
              </div>
            </div>

            {isProfileOpen && (
              <div className="absolute top-14 right-0 w-56 bg-[#1E1E1E] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-2">
                <Link
                  href={
                    user?.role === "garage"
                      ? "/garage/dashboard/profile"
                      : "/user/dashboard/profile"
                  }
                  className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {navT("myProfile")}
                  </span>
                </Link>
                <Link
                  href={
                    user?.role === "garage"
                      ? "/garage/dashboard/settings"
                      : "/user/dashboard/settings"
                  }
                  className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {navT("settings")}
                  </span>
                </Link>
                <div className="h-[1px] bg-white/10 my-1 mx-2"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">{navT("logout")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <RewardsInfoModal
        isOpen={isRewardsModalOpen}
        onClose={() => setIsRewardsModalOpen(false)}
      />
    </header>
  );
}
