"use client";

import { Bell, Menu, User } from "lucide-react";

export default function AdminHeader({ onMenuClick }) {
  return (
    <header className="h-20 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#222] px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg"
        >
          <Menu size={24} />
        </button>
        {/* We remove the static title here to allow dynamic page titles or just cleaner look */}
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
             <input 
               type="text" 
               placeholder="Search..." 
               className="bg-[#1a1a1a] border border-[#333] text-sm rounded-full pl-4 pr-10 py-2 text-white focus:outline-none focus:border-[#FF532D] w-64 hidden sm:block transition-all hover:border-[#444]"
             />
        </div>

        <button className="p-2.5 text-white/70 hover:text-[#FF532D] hover:bg-[#FF532D]/10 rounded-full relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF532D] rounded-full ring-2 ring-[#0a0a0a]"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-[#222]">
           <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-white">Admin User</div>
              <div className="text-xs text-white/40">Super Admin</div>
           </div>
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF532D] to-[#FF7E62] flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20 cursor-pointer">
             <User size={18} />
           </div>
        </div>
      </div>
    </header>
  );
}
