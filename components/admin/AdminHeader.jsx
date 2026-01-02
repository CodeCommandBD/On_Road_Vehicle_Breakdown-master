"use client";

import { Bell, Menu, User, LogOut, Settings, Search } from "lucide-react";
import Breadcrumb from "@/components/dashboard/Breadcrumb";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import axios from "axios";
import {
  selectUnreadNotificationsCount,
  setUnreadNotificationsCount,
  setSearchTerm,
  selectSearchTerm,
} from "@/store/slices/uiSlice";
import { selectUser, logout } from "@/store/slices/authSlice";
import Link from "next/link";

export default function AdminHeader({ onMenuClick }) {
  const dispatch = useDispatch();
  const router = useRouterWithLoading(); // Regular routing
  const user = useSelector(selectUser);
  const unreadCount = useSelector(selectUnreadNotificationsCount);
  const searchTerm = useSelector(selectSearchTerm);
  const [notifications, setNotifications] = useState([]);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);

  const profileRef = useRef(null);
  const notifyRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("/api/notifications");
        if (res.data.success) {
          setNotifications(res.data.notifications);
          dispatch(setUnreadNotificationsCount(res.data.unreadCount));
        }
      } catch (err) {
        console.error("Failed to fetch admin notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

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
      console.error("Failed to mark admin notifications read:", err);
    }
  };

  return (
    <header className="h-20 bg-[#020617]/80 backdrop-blur-md border-b border-[#222] px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg"
        >
          <Menu size={24} />
        </button>

        {/* Breadcrumbs */}
        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => dispatch(setSearchTerm(e.target.value))}
            className="bg-[#1a1a1a] border border-[#333] text-sm rounded-full pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#FF532D] w-48 lg:w-64 transition-all hover:border-[#444]"
          />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifyRef}>
          <button
            onClick={() => {
              setIsNotifyOpen(!isNotifyOpen);
              if (!isNotifyOpen && unreadCount > 0) markNotifyRead();
            }}
            className="p-2.5 text-white/70 hover:text-[#FF532D] hover:bg-[#FF532D]/10 rounded-full relative transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF532D] rounded-full ring-2 ring-[#0a0a0a]"></span>
            )}
          </button>

          {isNotifyOpen && (
            <div className="absolute top-14 right-0 w-80 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h4 className="text-sm font-bold text-white">Notifications</h4>
                <span className="text-[10px] text-[#FF532D] uppercase font-bold tracking-wider">
                  {unreadCount} New
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto scrollbar-hide">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => {
                        if (n.link) router.push(n.link);
                        setIsNotifyOpen(false);
                      }}
                      className="p-4 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <p className="text-xs font-bold text-white mb-1 group-hover:text-[#FF532D]">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-white/60 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[9px] text-white/30 mt-2 font-medium">
                        {new Date(n.createdAt).toLocaleDateString()} at{" "}
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-white/40">
                    <p className="text-sm">No notifications yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative border-l border-[#222] pl-6" ref={profileRef}>
          <div
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-white group-hover:text-[#FF532D] transition-colors">
                {user?.name || "Admin User"}
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest leading-none font-bold">
                {user?.role || "Super Admin"}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF532D] to-[#FF7E62] flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-105">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  className="w-full h-full rounded-full object-cover"
                  alt=""
                />
              ) : (
                <User size={18} />
              )}
            </div>
          </div>

          {isProfileOpen && (
            <div className="absolute top-14 right-0 w-52 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Link
                href="/admin/profile"
                className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <User size={16} />
                <span className="text-sm font-medium">Profile Settings</span>
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <Settings size={16} />
                <span className="text-sm font-medium">Admin Settings</span>
              </Link>
              <div className="h-[1px] bg-white/5 my-1 mx-2"></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left"
              >
                <LogOut size={16} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
