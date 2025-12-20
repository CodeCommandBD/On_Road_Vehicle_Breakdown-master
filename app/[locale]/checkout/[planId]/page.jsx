"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "@/store/slices/authSlice";
import { Check, Lock, CreditCard, Loader2 } from "lucide-react";
import Image from "next/image";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  const planId = params.planId;
  const billingCycle = searchParams.get("cycle") || "monthly";

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [billingInfo, setBillingInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/checkout/${planId}`);
      return;
    }

    if (user) {
      setBillingInfo({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: "",
      });
    }

    fetchPlan();
  }, [planId, user, isAuthenticated]);

  const fetchPlan = async () => {
    try {
      const response = await fetch(`/api/plans/${planId}`);
      const data = await response.json();
      if (data.success) {
        setPlan(data.data.plan);
      } else {
        alert("Plan not found");
        router.push("/pricing");
      }
    } catch (error) {
      console.error("Error fetching plan:", error);
      alert("Failed to load plan details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async () => {
    if (!agreed) {
      alert("Please agree to the terms and conditions");
      return;
    }

    if (!billingInfo.name || !billingInfo.email || !billingInfo.phone) {
      alert("Please fill in all required fields");
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch("/api/payments/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingCycle,
          billingInfo,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.paymentUrl) {
        // Redirect to SSLCommerz payment page
        window.location.href = data.data.paymentUrl;
      } else {
        console.error("Payment Init Failed:", data);
        alert(
          `Failed: ${data.message}\nError: ${data.error}\nStack: ${data.stack}`
        );
        setProcessing(false);
      }
    } catch (error) {
      console.error("Error initializing payment:", error);
      alert("Failed to process payment");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    if (loading) return null; // Already handled above but safe check

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-xl">
          <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Plan Not Found</h2>
          <p className="text-gray-400 mb-8">
            The plan you are looking for does not exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/pricing")}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            View All Plans
          </button>
        </div>
      </div>
    );
  }

  const price =
    billingCycle === "monthly" ? plan.price.monthly : plan.price.yearly;
  const monthlyEquivalent =
    billingCycle === "yearly" ? Math.round(price / 12) : price;
  const savings =
    billingCycle === "yearly" ? plan.price.monthly * 12 - plan.price.yearly : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/pricing">Pricing</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Checkout</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Complete Your Purchase
          </h1>
          <p className="text-gray-400">
            Secure checkout with SSLCommerz - Your information is protected
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Billing Info */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Lock className="w-5 h-5 text-green-500" />
                Billing Information
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={billingInfo.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={billingInfo.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={billingInfo.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-500"
                    placeholder="+880 1XXX-XXXXXX"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Address (Optional)
                  </label>
                  <textarea
                    name="address"
                    value={billingInfo.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-500"
                    placeholder="Your address"
                  />
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 text-orange-500 rounded focus:ring-orange-500 bg-gray-600 border-gray-500"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-300">
                    I agree to the{" "}
                    <a
                      href="/terms"
                      className="text-orange-500 hover:underline"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      className="text-orange-500 hover:underline"
                    >
                      Privacy Policy
                    </a>
                    . I understand that my subscription will automatically renew
                    unless cancelled.
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 shadow-2xl sticky top-4">
              <h2 className="text-xl font-bold text-white mb-6">
                Order Summary
              </h2>

              {/* Plan Details */}
              <div className="bg-white/10 rounded-xl p-5 mb-6 backdrop-blur">
                <h3 className="text-lg font-bold text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-white/80 text-xs mb-4">{plan.description}</p>

                <div className="space-y-2">
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-white mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-white/90">{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 4 && (
                    <p className="text-[10px] text-white/70 mt-2 pl-5">
                      +{plan.features.length - 4} more features
                    </p>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-white text-sm">
                  <span>
                    {billingCycle === "monthly" ? "Monthly" : "Annual"} Plan
                  </span>
                  <span className="font-bold">৳{price}</span>
                </div>

                {billingCycle === "yearly" && (
                  <>
                    <div className="flex justify-between text-white/80 text-xs">
                      <span>Monthly equivalent</span>
                      <span>৳{monthlyEquivalent}/mo</span>
                    </div>
                    <div className="flex justify-between text-green-300 font-semibold text-xs">
                      <span>You save (17%)</span>
                      <span>৳{savings}</span>
                    </div>
                  </>
                )}

                <div className="border-t border-white/20 pt-4">
                  <div className="flex justify-between text-white text-lg font-bold">
                    <span>Total</span>
                    <span>৳{price}</span>
                  </div>
                  <p className="text-white/60 text-[10px] mt-1 text-right">
                    Billed {billingCycle === "monthly" ? "monthly" : "yearly"}
                  </p>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handleCheckout}
                disabled={processing || !agreed}
                className="w-full bg-white text-orange-600 py-3.5 rounded-lg font-bold text-base hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay ৳{price} Now
                  </>
                )}
              </button>

              <p className="text-white/70 text-[10px] text-center mt-4">
                🔒 Secured by SSLCommerz
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center pb-8">
          <p className="text-gray-500 text-sm mb-4">We accept</p>
          <div className="flex justify-center gap-4 flex-wrap opacity-50 hover:opacity-100 transition-opacity">
            <div className="bg-gray-800 px-4 py-2 rounded">
              <p className="text-white text-xs font-semibold">bKash</p>
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded">
              <p className="text-white text-xs font-semibold">Nagad</p>
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded">
              <p className="text-white text-xs font-semibold">
                Visa/Mastercard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
