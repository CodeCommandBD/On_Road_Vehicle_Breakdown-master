"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "@/store/slices/authSlice";
import {
  CreditCard,
  Download,
  Calendar,
  DollarSign,
  FileText,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function BillingPage() {
  const router = useRouter();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchBillingData();
  }, [isAuthenticated]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      // Fetch subscription details
      const subResponse = await axios.get("/api/user/subscription");
      if (subResponse.data.success) {
        setSubscription(subResponse.data.data);
      }

      // Fetch payment history
      const paymentResponse = await axios.get("/api/user/payments");
      if (paymentResponse.data.success) {
        setPayments(paymentResponse.data.data.payments || []);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const downloadInvoice = async (paymentId) => {
    try {
      // TODO: Implement invoice download
      alert(`Download invoice for payment ${paymentId}`);
    } catch (error) {
      console.error("Error downloading invoice:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.subscription?.planId;
  const isSubscribed = subscription?.membershipTier !== "free";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Billing & Invoices
          </h1>
          <p className="text-gray-400">
            Manage your subscription and view payment history
          </p>
        </div>

        {/* Current Subscription Card */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 shadow-2xl mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {currentPlan?.name || "Free Plan"}
                </h2>
                <p className="text-white/80">
                  {isSubscribed
                    ? `${
                        subscription.subscription.billingCycle
                          .charAt(0)
                          .toUpperCase() +
                        subscription.subscription.billingCycle.slice(1)
                      } Billing`
                    : "No active subscription"}
                </p>
              </div>
            </div>

            {isSubscribed && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
                <p className="text-white/60 text-sm mb-1">Next Billing</p>
                <p className="text-white text-xl font-bold">
                  {formatDate(subscription.subscription.endDate)}
                </p>
                <p className="text-white/80 text-sm mt-1">
                  ৳{subscription.subscription.amount}
                </p>
              </div>
            )}
          </div>

          {isSubscribed && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100 transition-all"
              >
                Change Plan
              </Link>
              <button className="px-6 py-3 bg-white/20 backdrop-blur text-white rounded-lg font-semibold hover:bg-white/30 transition-all">
                Cancel Subscription
              </button>
            </div>
          )}

          {!isSubscribed && (
            <div className="mt-6">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100 transition-all"
              >
                Upgrade Now
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-white">Payment History</h2>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No payment history yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Your payment transactions will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-white text-sm">
                            {formatDate(payment.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-white font-medium">
                          {payment.metadata?.description ||
                            "Subscription Payment"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {payment.sslcommerz?.transactionId || payment._id}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-white font-semibold">
                          ৳{payment.amount}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              payment.status
                            )}`}
                          >
                            {payment.status.charAt(0).toUpperCase() +
                              payment.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {payment.status === "success" && (
                          <button
                            onClick={() => downloadInvoice(payment._id)}
                            className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Download
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Billing Information */}
        <div className="mt-8 bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            Billing Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Name</label>
              <p className="text-white font-medium">{user?.name || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <p className="text-white font-medium">{user?.email || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone</label>
              <p className="text-white font-medium">
                {user?.phone || "Not provided"}
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                User ID
              </label>
              <p className="text-white font-mono text-sm">
                {user?._id || "N/A"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all">
              Update Billing Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
