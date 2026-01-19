"use client";

import { useEffect, useState, useRef } from "react";
import StatsCards from "@/components/dashboard/StatsCards";
import BookingTable from "@/components/dashboard/BookingTable";
import RevenueChart from "@/components/dashboard/RevenueChart";

import {
  Plus,
  Wrench,
  MapPin,
  Star,
  CheckCircle,
  Crown,
  Navigation,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";
import LeaderboardWidget from "@/components/dashboard/LeaderboardWidget";
import UserRewardsCard from "@/components/dashboard/UserRewardsCard";
import { useDispatch } from "react-redux";
import { updateUser } from "@/store/slices/authSlice";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export default function GarageDashboard({ user }) {
  const t = useTranslations("Dashboard");
  const garageT = useTranslations("Garage");
  const bookingT = useTranslations("Bookings");
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  // 1. Fetch Garage Profile
  const { data: garageProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["garageProfile"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/garages/profile");
      return res.data.garage;
    },
    enabled: !!user?._id,
  });

  // 2. Fetch Team/Mechanics
  const { data: mechanics = [], isLoading: isTeamLoading } = useQuery({
    queryKey: ["garageTeam"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/garage/team");
      return res.data.teamMembers || [];
    },
    enabled: !!user?._id,
  });

  // 3. Fetch Bookings & Calculate Stats
  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery({
    queryKey: ["garageBookings", user?._id],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/api/bookings?userId=${user._id}&role=garage`,
      );
      const fetchedBookings = res.data.bookings || [];

      // Calculate Stats
      const totalBookings = fetchedBookings.length;
      const activeRequests = fetchedBookings.filter((b) =>
        ["pending", "accepted", "in_progress"].includes(b.status),
      ).length;

      // Monthly revenue (current month)
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthlyRevenue = fetchedBookings
        .filter((b) => {
          const bookingDate = new Date(b.createdAt);
          return (
            b.status === "completed" &&
            bookingDate.getMonth() === currentMonth &&
            bookingDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, b) => sum + (b.estimatedCost || 0), 0);

      // Completed today
      const today = new Date().setHours(0, 0, 0, 0);
      const completedToday = fetchedBookings.filter((b) => {
        const completedDate = new Date(b.updatedAt).setHours(0, 0, 0, 0);
        return b.status === "completed" && completedDate === today;
      }).length;

      // Success rate
      const completedBookings = fetchedBookings.filter(
        (b) => b.status === "completed",
      ).length;
      const successRate =
        totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      return {
        bookings: fetchedBookings,
        stats: {
          totalBookings,
          monthlyRevenue,
          activeRequests,
          completedToday,
          successRate,
        },
      };
    },
    enabled: !!user?._id,
  });

  const isLoading = isProfileLoading || isTeamLoading || isBookingsLoading;

  const bookings = bookingsData?.bookings || [];
  const stats = {
    ...(bookingsData?.stats || {}),
    rating: garageProfile?.rating?.average || 0,
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Wrench className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white">
          {garageProfile?.name
            ? `${garageProfile.name} ${t("dashboard")}`
            : t("dashboard")}
        </h1>
        <Link
          href="/garage/dashboard/services/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          {garageT("addService")}
        </Link>
      </div>
      {/* Mission Control Launch Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link
          href="/garage/dashboard/navigation"
          className="group relative bg-[#1A1A1A] border border-orange-500/20 rounded-3xl p-8 overflow-hidden hover:border-orange-500/50 transition-all shadow-xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-orange-500/10 transition-all"></div>

          <div className="relative z-10">
            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 border border-orange-500/20 group-hover:scale-110 transition-transform">
              <Activity className="text-orange-500" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              {garageT("launchMission")}
              <ArrowUpRight className="text-white/20 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              {garageT("missionDesc")}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#1A1A1A] bg-white/5 flex items-center justify-center"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                ))}
              </div>
              <span className="text-xs text-orange-400 font-bold uppercase tracking-widest">
                {t("liveFeed")}
              </span>
            </div>
          </div>
        </Link>

        {/* Support/Resource Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <h3 className="text-lg font-bold text-white mb-4">
            {garageT("quickResources")}
          </h3>
          <div className="space-y-4">
            <Link href="/garage/dashboard/profile">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group/card">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-blue-400" />
                  <div>
                    <p className="text-sm font-bold text-white group-hover/card:text-blue-400 transition-colors">
                      {garageT("serviceArea")}
                    </p>
                    <p className="text-[10px] text-white/40">
                      {garageT("manageZone")}
                    </p>
                  </div>
                </div>
                <ArrowUpRight
                  className="text-white/20 group-hover/card:text-white transition-colors"
                  size={16}
                />
              </div>
            </Link>

            <Link href="/garage/dashboard/reviews">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group/card">
                <div className="flex items-center gap-3">
                  <Star size={18} className="text-orange-400" />
                  <div>
                    <p className="text-sm font-bold text-white group-hover/card:text-orange-400 transition-colors">
                      {garageT("reviewPortal")}
                    </p>
                    <p className="text-[10px] text-white/40">
                      {garageT("checkFeedback")}
                    </p>
                  </div>
                </div>
                <ArrowUpRight
                  className="text-white/20 group-hover/card:text-white transition-colors"
                  size={16}
                />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Mechanic Live Status Widget */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-500" /> Mechanic Live Status
        </h3>
        {mechanics.length === 0 ? (
          <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
            <p className="text-white/60">No mechanics in team</p>
            <Link
              href="/garage/dashboard/team"
              className="text-orange-500 hover:underline mt-2 inline-block"
            >
              + Add Members
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mechanics.map((member) => (
              <div
                key={member._id}
                className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#1A1A1A] ${
                      member.user?.availability?.status === "busy"
                        ? "bg-orange-500"
                        : member.user?.availability?.status === "online"
                          ? "bg-green-500"
                          : "bg-red-500"
                    }`}
                  />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{member.name}</p>
                  <p className="text-xs text-white/40 capitalize">
                    {member.user?.availability?.status || "Offline"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Bookings Table */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          {bookingT("title")}
        </h2>
        <BookingTable type="garage" bookings={bookings} />
      </div>
      {/* Rewards & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <UserRewardsCard
          user={user}
          stats={{ points: user?.rewardPoints || 0 }}
        />
        <LeaderboardWidget role="garage" />
      </div>
    </div>
  );
}
