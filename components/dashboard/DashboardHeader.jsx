"use client";

import { Menu, Bell, Search, User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar } from "@/store/slices/uiSlice";
import { selectUser } from "@/store/slices/authSlice";
import Breadcrumb from "./Breadcrumb";

export default function DashboardHeader() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

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
          <Breadcrumb />
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        {/* Search - Hidden on mobile */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 w-48 lg:w-64 transition-all"
          />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#1E1E1E]"></span>
          </button>

          <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block"></div>

          {/* User Profile Summary */}
          <div className="flex items-center gap-3 pl-2 group cursor-pointer">
            <div className="hidden lg:block text-right">
              <p className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors">
                {user?.name || "Guest User"}
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest leading-none font-bold">
                {user?.role || "Member"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-orange p-[1px]">
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
        </div>
      </div>
    </header>
  );
}
