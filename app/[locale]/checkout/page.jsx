"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import {
  Loader2,
  CheckCircle,
  ShieldCheck,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const PLANS = {
  trial: {
    name: "Trial",
    price: 0,
    features: ["5 service calls", "60 min response", "Email support"],
  },
  basic: {
    name: "Basic",
    price: 499,
    features: [
      "15 service calls/month",
      "30 min response",
      "Email & chat support",
      "Basic analytics",
    ],
  },
  standard: {
    name: "Standard",
    price: 999,
    features: [
      "30 service calls/month",
      "20 min response",
      "Priority support",
      "Advanced analytics",
    ],
  },
  premium: {
    name: "Premium",
    price: 1999,
    features: [
      "Unlimited service calls",
      "15 min response",
      "24/7 priority support",
      "Advanced analytics",
      "Featured listing",
    ],
  },
};

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useSelector(selectUser);

  const [isProcessing, setIsProcessing] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const planType = searchParams.get("plan") || "basic";
  const cycle = searchParams.get("cycle") || "monthly";
  const selectedPlan = PLANS[planType] || PLANS.basic;

  // Auto-fill user info
  useEffect(() => {
    if (user) {
      setBillingInfo({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address?.street || "",
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setBillingInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to continue");
      router.push("/login");
      return;
    }

    setIsProcessing(true);

    try {
      // First, get the plan ID from the database by tier
      const planResponse = await axios.get(`/api/plans?tier=${planType}`);

      if (!planResponse.data.success || !planResponse.data.plans?.[0]) {
        toast.error("Plan not found");
        setIsProcessing(false);
        return;
      }

      const plan = planResponse.data.plans[0];

      // Initialize payment with SSLCommerz using correct field names
      const response = await axios.post("/api/payments/init", {
        planId: plan._id,
        billingCycle: cycle,
        billingInfo: {
          name: billingInfo.name,
          email: billingInfo.email,
          phone: billingInfo.phone,
          address: billingInfo.address,
        },
      });

      if (response.data.success && response.data.data?.paymentUrl) {
        // Redirect to SSLCommerz payment page
        window.location.href = response.data.data.paymentUrl;
      } else {
        toast.error(response.data.message || "Payment initialization failed");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(
        error.response?.data?.message || "Payment failed. Please try again."
      );
      setIsProcessing(false);
    }
  };

  const calculateTotal = () => {
    const basePrice = selectedPlan.price;
    const yearlyDiscount = cycle === "yearly" ? 0.2 : 0;
    const yearlyPrice = basePrice * 12 * (1 - yearlyDiscount);
    return cycle === "yearly" ? yearlyPrice : basePrice;
  };

  return (
    <div className="min-h-screen bg-[#111] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            Complete Your Purchase
          </h1>
          <p className="text-white/60">Secure payment powered by SSLCommerz</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sticky top-6">
              <h2 className="text-xl font-bold text-white mb-6">
                Order Summary
              </h2>

              {/* Plan Details */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80">
                    {selectedPlan.name} Plan
                  </span>
                  <span className="text-white font-bold">
                    ৳{selectedPlan.price}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Billing Cycle</span>
                  <span className="text-white/80 capitalize">{cycle}</span>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6 pt-6 border-t border-white/10">
                <h3 className="text-sm font-semibold text-white/60 mb-3">
                  Included Features
                </h3>
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-white/80"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Yearly Discount */}
              {cycle === "yearly" && (
                <div className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm font-medium">
                    🎉 20% yearly discount applied!
                  </p>
                </div>
              )}

              {/* Total */}
              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80">Total</span>
                  <span className="text-2xl font-bold text-white">
                    ৳{calculateTotal().toFixed(2)}
                  </span>
                </div>
                <p className="text-white/40 text-xs">
                  {cycle === "yearly" ? "Billed annually" : "Billed monthly"}
                </p>
              </div>
            </div>
          </div>

          {/* Billing Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleCheckout} className="space-y-6">
              {/* Billing Information */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">
                  Billing Information
                </h2>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={billingInfo.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={billingInfo.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={billingInfo.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                      placeholder="+880 1XXX-XXXXXX"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Address *
                    </label>
                    <textarea
                      value={billingInfo.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      required
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
                      placeholder="Enter your address"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">
                  Payment Method
                </h2>

                <div className="p-4 bg-white/5 border border-orange-500/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-6 h-6 text-orange-500" />
                    <span className="text-white font-medium">
                      SSLCommerz Payment Gateway
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">
                    Secure payment with credit/debit cards, mobile banking, and
                    internet banking
                  </p>
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-blue-400 font-medium text-sm mb-1">
                    Secure Payment
                  </h3>
                  <p className="text-blue-400/80 text-sm">
                    Your payment information is encrypted and secure. We never
                    store your card details.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-6 h-6" />
                    Proceed to Payment
                  </>
                )}
              </button>

              {/* Terms */}
              <p className="text-white/40 text-xs text-center">
                By completing this purchase, you agree to our{" "}
                <a
                  href="/terms"
                  className="text-orange-500 hover:text-orange-400"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="text-orange-500 hover:text-orange-400"
                >
                  Privacy Policy
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
