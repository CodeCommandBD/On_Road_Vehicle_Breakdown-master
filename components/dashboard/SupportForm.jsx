"use client";

import { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import { Send, Loader2, Rocket, Clock, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SupportForm() {
  // const t = useTranslations("Support"); // Assuming translations will be added later
  const user = useSelector(selectUser);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const planTier = user?.planTier || "free";
  const isVip = ["premium", "enterprise"].includes(planTier);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await axios.post("/api/support", { subject, message });
      if (res.data.success) {
        setFeedback({ type: "success", text: "Ticket Sent Successfully!" });
        setSubject("");
        setMessage("");
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: "Failed to send ticket. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
      {/* Dynamic Background Badge for VIPs */}
      {isVip && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-500/20 to-transparent w-64 h-full pointer-events-none" />
      )}

      <div className="flex items-start justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            Contact Support
            {isVip && (
              <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <Rocket className="w-3 h-3" /> VIP Priority
              </span>
            )}
          </h2>
          <p className="text-white/60 text-sm">
            We are here to help you. Fill out the form below.
          </p>
        </div>

        {/* Expected Response Time Badge */}
        <div
          className={`px-4 py-2 rounded-xl border ${
            isVip
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
              : "bg-white/5 border-white/10 text-white/50"
          } text-xs font-medium text-center`}
        >
          <p className="mb-1 opacity-70">Expected Response</p>
          <div className="flex items-center justify-center gap-1.5 text-sm font-bold">
            <Clock className="w-4 h-4" />
            {isVip ? "4-6 Hours" : "24-48 Hours"}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Subject
          </label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="e.g., Billing Issue or App Bug"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Message
          </label>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 transition-colors resize-none"
            placeholder="Describe your issue in detail..."
          />
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {feedback.type === "success" ? (
              <ShieldCheck className="w-4 h-4" />
            ) : null}
            {feedback.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            isVip
              ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]"
              : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Ticket {isVip && "(Priority Queue)"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
