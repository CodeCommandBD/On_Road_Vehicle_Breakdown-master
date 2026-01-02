"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import { CheckCircle, ArrowRight, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useSelector, useDispatch } from "react-redux";
import { selectUserRole, updateUser } from "@/store/slices/authSlice";
import axios from "axios";

function PaymentSuccessContent() {
  const router = useRouterWithLoading(); // Regular routing
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  const userRole = useSelector(selectUserRole);

  const transaction = searchParams.get("transaction");
  const planName = searchParams.get("plan");
  const cycle = searchParams.get("cycle");
  const dispatch = useDispatch();

  useEffect(() => {
    // Refresh user profile to sync with Redux
    const refreshProfile = async () => {
      try {
        const response = await axios.get("/api/profile");
        if (response.data.success) {
          dispatch(updateUser(response.data.user));
          console.log("Profile synced with Redux after payment!");
        }
      } catch (err) {
        console.error("Failed to sync profile:", err);
      }
    };

    refreshProfile();

    // Trigger confetti animation
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FF532D", "#FFA895", "#F23C13"],
      });
    }, 250);

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  // Handle auto-redirect when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      const dashboardPath =
        userRole === "garage" ? "/garage/dashboard" : "/user/dashboard";
      router.push(dashboardPath);
    }
  }, [countdown, userRole, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 via-gray-900 to-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Success Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <CheckCircle className="w-32 h-32 text-green-500 relative animate-bounce" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
          Payment Successful! 🎉
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Your subscription has been activated successfully
        </p>

        {/* Transaction Details */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            Transaction Details
          </h2>
          <div className="space-y-4 text-left">
            {transaction && (
              <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <span className="text-gray-400">Transaction ID</span>
                <span className="text-white font-mono text-sm">
                  {transaction}
                </span>
              </div>
            )}
            {planName && (
              <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <span className="text-gray-400">Plan</span>
                <span className="text-white font-semibold">{planName}</span>
              </div>
            )}
            {cycle && (
              <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <span className="text-gray-400">Billing Cycle</span>
                <span className="text-white capitalize">{cycle}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Status</span>
              <span className="text-green-500 font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href={
              userRole === "garage" ? "/garage/dashboard" : "/user/dashboard"
            }
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/user/billing"
            className="bg-gray-800 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5" />
            View Invoice
          </Link>
        </div>

        {/* Auto Redirect Notice */}
        <p className="text-gray-500 text-sm">
          Redirecting to dashboard in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
