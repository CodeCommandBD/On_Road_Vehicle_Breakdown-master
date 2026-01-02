"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { XCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function PaymentFailPage() {
  const router = useRouterWithLoading(); // Regular routing
  const searchParams = useSearchParams();

  const transaction = searchParams.get("transaction");
  const reason = searchParams.get("reason") || searchParams.get("error");

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-gray-900 to-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <XCircle className="w-32 h-32 text-red-500 relative" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
          Payment Failed
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          We couldn't process your payment. Please try again.
        </p>

        {/* Error Details */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">What Happened?</h2>
          <div className="space-y-4 text-left">
            {transaction && (
              <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <span className="text-gray-400">Transaction ID</span>
                <span className="text-white font-mono text-sm">
                  {transaction}
                </span>
              </div>
            )}
            {reason && (
              <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <span className="text-gray-400">Reason</span>
                <span className="text-red-400 text-sm">{reason}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Status</span>
              <span className="text-red-500 font-bold flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Failed
              </span>
            </div>
          </div>
        </div>

        {/* Common Reasons */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-lg font-bold text-white mb-4">
            Common Reasons for Payment Failure:
          </h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              <span>Insufficient funds in your account</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              <span>Incorrect card details or OTP</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              <span>Payment gateway timeout or network issue</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              <span>Card not enabled for online transactions</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          <Link
            href="/pricing"
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <RefreshCcw className="w-5 h-5" />
            Try Again
          </Link>
          <Link
            href="/"
            className="bg-gray-800 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Home
          </Link>
        </div>

        <p className="text-gray-500 text-sm mt-8">
          Need help?{" "}
          <Link href="/contact" className="text-orange-500 hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
