"use client";

import { Bell, User, Search, Award, Menu } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { toggleSidebar } from "@/store/slices/uiSlice";
import Link from "next/link";

export default function DashboardHeader({ user, notificationCount = 0 }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const dispatch = useDispatch();

  const getMembershipColor = (tier) => {
    const colors = {
      free: "bg-gray-500",
      basic: "bg-blue-500",
      standard: "bg-purple-500",
      premium: "bg-gradient-to-r from-yellow-400 to-orange-500",
    };
    return colors[tier] || colors.free;
  };

  return (
    <div className="glass-card rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        {/* Left Section - User Info */}
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          {/* Hamburger Menu - Shows on mobile/tablet */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-orange flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-glow-orange">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-[#1E1E1E] pulse-dot"></div>
          </div>

          {/* Greeting */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-xl font-bold text-white truncate">
              Welcome back, {user?.name?.split(" ")[0] || "User"}! 👋
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold text-white ${getMembershipColor(
                  user?.membershipTier
                )}`}
              >
                <Award className="w-3 h-3 inline mr-1" />
                {user?.membershipTier?.toUpperCase() || "FREE"} Member
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          {/* Search */}
          <div className="hidden lg:flex items-center bg-white/10 rounded-xl px-4 py-2 border border-white/20">
            <Search className="w-4 h-4 text-white/60 mr-2" />
            <input
              type="text"
              placeholder="Search bookings..."
              className="bg-transparent border-none outline-none text-white text-sm w-32 lg:w-48 placeholder:text-white/50"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all scale-hover"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold animate-pulse">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown - Will be populated later */}
            {showNotifications && (
              <div className="absolute right-0 top-12 sm:top-14 w-72 sm:w-80 glass-card rounded-xl p-4 z-50 slide-up">
                <h3 className="text-white font-semibold mb-3">Notifications</h3>
                <p className="text-white/60 text-sm">No new notifications</p>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all scale-hover"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 top-12 sm:top-14 w-56 sm:w-64 glass-card rounded-xl p-4 z-50 slide-up">
                <div className="text-white">
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-sm text-white/60">{user?.email}</p>
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <Link
                      href="/user/dashboard/profile"
                      className="w-full text-left py-2 hover:bg-white/10 rounded-lg px-2 transition block"
                      onClick={() => setShowProfile(false)}
                    >
                      Profile Settings
                    </Link>
                    <button className="w-full text-left py-2 hover:bg-white/10 rounded-lg px-2 transition text-red-400">
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
