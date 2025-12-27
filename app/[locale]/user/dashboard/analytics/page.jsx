"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import AnalyticsCharts from "@/components/dashboard/analytics/AnalyticsCharts"; // Ensure this matches path
import { Lock, Loader2, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
  const user = useSelector(selectUser);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Role Check State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if user is on Enterprise plan
    const isEnterprise =
      user.membershipTier === "enterprise" || user.planTier === "enterprise";

    if (isEnterprise) {
      // For Enterprise: Must be Owner or Admin
      axios
        .get("/api/organizations")
        .then((res) => {
          const orgs = res.data.data || [];
          // Authorized if they have 'owner' or 'admin' role in ANY active org
          const hasAuthRole = orgs.some(
            (o) => o.role === "admin" || o.role === "owner"
          );
          setIsAuthorized(hasAuthRole);
        })
        .catch((err) => {
          console.error("Auth check failed:", err);
          setIsAuthorized(false);
        })
        .finally(() => setRoleChecked(true));
    } else {
      // Non-Enterprise (Private/Premium):
      // Usually these users are Owners of their own solo account.
      // Or if Premium is also restricted? User said "Only Enterprise Admin/Owner".
      // Assuming Premium users HAVE access (as per original logic "Upgrade to Premium").
      // So if not Enterprise, we grant access if plan is eligible.
      setIsAuthorized(true);
      setRoleChecked(true);
    }
  }, [user]);

  const isPlanEligible =
    ["premium", "enterprise"].includes(user?.membershipTier) ||
    ["premium", "enterprise"].includes(user?.planTier);

  // Access is granted if:
  // 1. Plan is eligible (Premium/Enterprise)
  // 2. Role check passed (If Enterprise, must be Owner/Admin. If Premium, passed by default)
  const hasAccess = isPlanEligible && isAuthorized && roleChecked;
  const isRestricted = !isAuthorized && roleChecked && isPlanEligible; // specifically restricted by role

  useEffect(() => {
    if (hasAccess) {
      fetchAnalytics();
    } else if (roleChecked) {
      setLoading(false);
    }
  }, [hasAccess, roleChecked]);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get("/api/analytics");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <TrendingUp className="text-blue-500" />
          Advanced Analytics
        </h1>
        <p className="text-white/60 mt-2">
          Deep dive into your vehicle's health and spending habits.
        </p>
      </div>

      {!hasAccess ? (
        // --- LOCK SCREEN FOR FREE/STANDARD USERS ---
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-[#121212]/80 backdrop-blur-sm">
          <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            {/* Glowing effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 blur-[50px] rounded-full pointing-events-none" />

            <div className="bg-yellow-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
              <Lock className="w-8 h-8 text-yellow-500" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 relative z-10">
              Premium Feature
            </h2>
            <p className="text-white/60 mb-6 relative z-10">
              Unlock detailed cost analysis, vehicle health trends, and service
              history reports with the Premium plan.
              <br />
              {isRestricted
                ? "Access restricted to Organization Owners & Admins."
                : ""}
            </p>

            {!isRestricted && (
              <Link
                href="/pricing"
                className="block w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all relative z-10"
              >
                Upgrade to Premium
              </Link>
            )}
          </div>
        </div>
      ) : (
        // --- CONTENT FOR PREMIUM USERS ---
        <>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            data && <AnalyticsCharts data={data} />
          )}
        </>
      )}

      {/* Show a blurred background preview for locked users to entice them */}
      {!hasAccess && (
        <div className="opacity-10 pointer-events-none grid grid-cols-1 lg:grid-cols-2 gap-6 filter blur-sm select-none">
          <div className="h-64 bg-white/10 rounded-2xl" />
          <div className="h-64 bg-white/10 rounded-2xl" />
          <div className="h-32 bg-white/10 rounded-2xl lg:col-span-2" />
        </div>
      )}
    </div>
  );
}
