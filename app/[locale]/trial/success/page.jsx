"use client";

import { useEffect } from "react";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import { Sparkles, CheckCircle, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useSelector } from "react-redux";
import { selectUserRole } from "@/store/slices/authSlice";

export default function TrialSuccessPage() {
  const router = useRouterWithLoading(); // Regular routing
  const userRole = useSelector(selectUserRole);

  useEffect(() => {
    // Trigger confetti
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#9333EA", "#EC4899", "#F59E0B"],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Success Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center relative shadow-2xl">
              <Sparkles className="w-16 h-16 text-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
          Trial Activated! 🎉
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Your 7-day free trial has been successfully activated
        </p>

        {/* Trial Details */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            Your Trial Benefits
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-white font-semibold">Service Calls</span>
              </div>
              <span className="text-purple-300 font-bold">1 call included</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-500" />
                <span className="text-white font-semibold">Duration</span>
              </div>
              <span className="text-purple-300 font-bold">7 days</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-white font-semibold">Response Time</span>
              </div>
              <span className="text-purple-300 font-bold">60 minutes</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">What's Next?</h3>
          <ul className="space-y-2 text-gray-300 text-sm text-left">
            <li className="flex items-start gap-2">
              <span className="text-purple-500">1.</span>
              <span>Explore your dashboard and available features</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">2.</span>
              <span>Book your first service call if needed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">3.</span>
              <span>
                Upgrade to a paid plan before trial expires to keep your
                benefits
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={
              userRole === "garage" ? "/garage/dashboard" : "/user/dashboard"
            }
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/pricing"
            className="bg-gray-800 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-3"
          >
            View Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
