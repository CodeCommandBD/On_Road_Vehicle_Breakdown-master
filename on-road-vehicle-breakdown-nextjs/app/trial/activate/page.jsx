"use client";

import { useState } from "use";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth";
import { Sparkles, Check, Loader2, Clock } from "lucide-react";

export default function TrialActivatePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleActivateTrial = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/trial/activate", {
        method: "POST",
      });

      const data = await response.json();

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

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/login?redirect=/trial/activate");
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
            Experience our Basic plan features for 7 days, absolutely free!
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
                  Full access to basic features for one week
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

            <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg">
              <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">
                  No Credit Card Required
                </h3>
                <p className="text-gray-400 text-sm">
                  Start your trial without any payment information
                </p>
              </div>
            </div>
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
