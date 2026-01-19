"use client";

import { useState, useEffect } from "react";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "@/store/slices/authSlice";
import {
  Sparkles,
  Check,
  Loader2,
  Clock,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import axiosInstance from "@/lib/axios";

export default function TrialActivatePage() {
  const router = useRouterWithLoading(); // Regular routing
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleActivateTrial = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/trial/activate");
      const data = response.data;

      if (data.success) {
        // Redirect to success page
        router.push("/trial/success");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to activate trial. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/trial/activate");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Start Your Free Trial
          </h1>
          <p className="text-xl text-gray-300">
            Experience full premium features for 7 days. Verification via credit
            card is required to prevent misuse.
          </p>
        </div>

        {/* Trial Features */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Clock className="w-7 h-7 text-purple-500" />
            What's Included in Your Trial
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg">
              <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">
                  1 Free Service Call
                </h3>
                <p className="text-gray-400 text-sm">
                  Get roadside assistance once during your trial period
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg">
              <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">7-Day Access</h3>
                <p className="text-gray-400 text-sm">
                  Full access to standard features for one week
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg">
              <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">
                  Standard Response Time
                </h3>
                <p className="text-gray-400 text-sm">
                  60-minute response time for breakdown assistance
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg">
              <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">Email Support</h3>
                <p className="text-gray-400 text-sm">
                  Get help from our support team via email
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">
                  Card Verification Required
                </h3>
                <p className="text-gray-400 text-sm">
                  We'll do a ৳0 authorization to verify your identity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card Info Placeholder Section */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-8 border border-white/5 shadow-inner">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-blue-500" />
            Secure Verification
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-2 tracking-widest">
                Card Holder Name
              </label>
              <input
                type="text"
                placeholder="JOHN DOE"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                disabled
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2 tracking-widest">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="**** **** **** ****"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                  disabled
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2 tracking-widest">
                    Expiry
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2 tracking-widest">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="***"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                    disabled
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 text-center mt-4 uppercase tracking-tighter">
              🔒 Encrypted & Secured by SSLCommerz
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Activate Button */}
        <button
          onClick={handleActivateTrial}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 rounded-lg font-bold text-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Activating Trial...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              Activate Free Trial
            </>
          )}
        </button>

        {/* Terms */}
        <p className="text-gray-500 text-sm text-center mt-6">
          By activating the trial, you agree to our{" "}
          <a href="/terms" className="text-purple-400 hover:underline">
            Terms of Service
          </a>
          . No payment required. Trial expires in 7 days.
        </p>
      </div>
    </div>
  );
}
