"use client";

import {
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Ban,
  Receipt,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";

export default function PaymentDetailsModal({ payment, isOpen, onClose }) {
  if (!isOpen || !payment) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle className="text-green-500" size={24} />;
      case "pending":
        return <Clock className="text-orange-500" size={24} />;
      case "failed":
        return <AlertTriangle className="text-red-500" size={24} />;
      case "refunded":
        return <XCircle className="text-red-500" size={24} />;
      case "cancelled":
        return <Ban className="text-gray-400" size={24} />;
      default:
        return <Clock className="text-gray-500" size={24} />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1E1E1E] rounded-xl border border-white/5 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#1E1E1E] z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/5`}>
              {getStatusIcon(payment.status)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Payment Details</h2>
              <p className="text-white/40 text-sm">
                ID:{" "}
                {payment.sslcommerz?.transactionId ||
                  payment.invoice?.invoiceNumber ||
                  payment._id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Amount Section */}
          <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-xl border border-white/5">
            <span className="text-white/40 text-sm uppercase tracking-wider mb-2">
              Total Amount
            </span>
            <div
              className={`text-4xl font-bold ${
                payment.type === "payout" ? "text-red-400" : "text-green-400"
              }`}
            >
              {payment.type === "payout" ? "-" : ""}
              {formatCurrency(payment.amount)}
            </div>
            <div className="mt-2 px-3 py-1 rounded-full bg-white/5 text-xs text-white/60 uppercase">
              {payment.currency || "BDT"} • {payment.paymentMethod || "manual"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* User Info */}
            <div>
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Receipt size={18} className="text-[#FF532D]" /> User
                Information
              </h3>
              <div className="space-y-3">
                <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                  <p className="text-white/40 text-xs mb-1">Name</p>
                  <p className="text-white font-medium">
                    {payment.user?.name || "N/A"}
                  </p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                  <p className="text-white/40 text-xs mb-1">Email</p>
                  <p className="text-white font-medium">
                    {payment.user?.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Info */}
            <div>
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-[#FF532D]" /> Transaction
                Info
              </h3>
              <div className="space-y-3">
                <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                  <p className="text-white/40 text-xs mb-1">Type</p>
                  <p className="text-white font-medium capitalize">
                    {payment.type?.replace("_", " ") || "N/A"}
                  </p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                  <p className="text-white/40 text-xs mb-1">Date</p>
                  <p className="text-white font-medium">
                    {payment.createdAt
                      ? format(new Date(payment.createdAt), "PPP p")
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata / Raw JSON (for admin debugging) */}
          <div>
            <h3 className="text-white font-medium mb-4">Raw Metadata</h3>
            <pre className="bg-black/40 p-4 rounded-lg border border-white/5 text-xs text-white/60 overflow-x-auto font-mono">
              {JSON.stringify(payment, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-[#1E1E1E]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors"
          >
            Close
          </button>
          {/* Can add Refund/Action buttons here later */}
        </div>
      </div>
    </div>
  );
}
