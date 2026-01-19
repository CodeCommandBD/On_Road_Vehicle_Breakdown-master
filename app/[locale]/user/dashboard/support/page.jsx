"use client";

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Sidebar from "@/components/layout/Sidebar";
import SupportForm from "@/components/dashboard/SupportForm";
import { User, Phone, Mail, Crown } from "lucide-react";

export default function SupportPage() {
  const { data: manager = null, isLoading } = useQuery({
    queryKey: ["supportData"],
    queryFn: async () => {
      const res = await axiosInstance.get("/support/tickets");
      return res.data.data.accountManager;
    },
  });

  return (
    <div className="flex h-screen bg-[#121212] text-white overflow-hidden font-outfit">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold">Help & Support</h1>
              <p className="text-white/60 mt-2">
                Need assistance? Our team is ready to help you get back on the
                road.
              </p>
            </div>

            {/* Dedicated Manager Card (Premium Only) */}
            {manager && (
              <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Crown className="w-32 h-32" />
                </div>

                <div className="flex items-center gap-6 relative z-10">
                  {manager.avatar ? (
                    <img
                      src={manager.avatar}
                      alt={manager.name}
                      className="w-20 h-20 rounded-full border-2 border-purple-500 object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full border-2 border-purple-500 flex items-center justify-center bg-purple-500/20">
                      <User className="w-8 h-8 text-purple-300" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider bg-purple-500 text-white px-2 py-0.5 rounded-full">
                        Dedicated Manager
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      {manager.name}
                    </h2>
                    <p className="text-purple-200 text-sm">
                      Priority Support Specialist
                    </p>

                    <div className="flex items-center gap-3 mt-4">
                      {manager.phone && (
                        <a
                          href={`https://wa.me/${manager.phone}`}
                          target="_blank"
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          WhatsApp
                        </a>
                      )}
                      <a
                        href={`mailto:${manager.email}`}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Email Direct
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <SupportForm />

            {/* Support Info Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-bold text-lg mb-2 text-blue-400">
                  Email Us Directly
                </h3>
                <p className="text-sm text-white/60">
                  Prefer your own email client? Reach us at:
                  <br />
                  <span className="text-white font-mono mt-1 block">
                    support@breakdownbd.com
                  </span>
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-bold text-lg mb-2 text-green-400">
                  Community Forum
                </h3>
                <p className="text-sm text-white/60">
                  Find answers from other users and our knowledge base.
                  <br />
                  <span className="text-white/40 text-xs mt-1 block">
                    (Coming Soon)
                  </span>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
