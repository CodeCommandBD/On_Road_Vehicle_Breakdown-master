"use client";

import { useState } from "react";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  User,
  Wrench,
  Shield,
  Lock,
} from "lucide-react";
import { toast } from "react-toastify";
import * as Tabs from "@radix-ui/react-tabs";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [activeTab, setActiveTab] = useState("user");
  const router = useRouterWithLoading(); // Regular routing

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role: activeTab }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send reset email");
      }

      setEmailSent(true);
      toast.success("Password reset link sent! Check your email.");
      reset();
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    reset();
    setEmailSent(false);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-12 relative z-10 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-green-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

          <div className="text-center relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">
              Check Your Email
            </h1>

            <p className="text-gray-400 mb-8">
              We've sent a password reset link to your email address. Please
              check your inbox and follow the instructions.
            </p>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8">
              <p className="text-sm text-blue-400">
                <strong>Didn't receive the email?</strong>
                <br />
                Check your spam folder or try again in a few minutes.
              </p>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[#ff4800] hover:text-[#ff6a3d] font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-12 relative z-10 overflow-hidden">
        {/* Decorative Glows */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#ff4800]/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="text-center mb-10 relative z-10">
          <div className="inline-block p-1 px-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em] mb-4 animate-pulse">
            Password Recovery
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-2xl">
            FORGOT
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4800] via-[#ff6a3d] to-[#ff8800]">
              PASSWORD?
            </span>
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Enter your email to receive a reset link
          </p>
        </div>

        <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
          <Tabs.List className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-10 bg-black/40 p-2 rounded-[24px] border border-white/10 shadow-2xl backdrop-blur-md">
            <Tabs.Trigger
              value="user"
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-2xl transition-all duration-500 ${
                activeTab === "user"
                  ? "bg-gradient-to-br from-[#ff4800] to-[#ff6a3d] text-white shadow-[0_8px_20px_rgba(255,72,0,0.4)] transform scale-[1.05] z-10"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <User
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  activeTab === "user" ? "fill-white/20" : ""
                }`}
              />
              <span className="font-black text-[10px] sm:text-xs tracking-widest">
                USER
              </span>
            </Tabs.Trigger>

            <Tabs.Trigger
              value="garage"
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-2xl transition-all duration-500 ${
                activeTab === "garage"
                  ? "bg-gradient-to-br from-[#ff4800] to-[#ff6a3d] text-white shadow-[0_8px_20px_rgba(255,72,0,0.4)] transform scale-[1.05] z-10"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Shield
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  activeTab === "garage" ? "fill-white/20" : ""
                }`}
              />
              <span className="font-black text-[10px] sm:text-xs tracking-widest">
                GARAGE
              </span>
            </Tabs.Trigger>

            <Tabs.Trigger
              value="mechanic"
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-2xl transition-all duration-500 ${
                activeTab === "mechanic"
                  ? "bg-gradient-to-br from-[#ff4800] to-[#ff6a3d] text-white shadow-[0_8px_20px_rgba(255,72,0,0.4)] transform scale-[1.05] z-10"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Wrench
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  activeTab === "mechanic" ? "fill-white/20" : ""
                }`}
              />
              <span className="font-black text-[10px] sm:text-xs tracking-widest">
                MECHANIC
              </span>
            </Tabs.Trigger>

            <Tabs.Trigger
              value="admin"
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-2xl transition-all duration-500 ${
                activeTab === "admin"
                  ? "bg-gradient-to-br from-[#ff4800] to-[#ff6a3d] text-white shadow-[0_8px_20px_rgba(255,72,0,0.4)] transform scale-[1.05] z-10"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Lock
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  activeTab === "admin" ? "fill-white/20" : ""
                }`}
              />
              <span className="font-black text-[10px] sm:text-xs tracking-widest">
                ADMIN
              </span>
            </Tabs.Trigger>
          </Tabs.List>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8 relative z-10"
          >
            {/* Email Field */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div
                className={`group flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-4 my-2 transition-all duration-500 hover:bg-white/[0.05] focus-within:bg-white/[0.08] focus-within:border-[#ff4800] focus-within:ring-4 focus-within:ring-[#ff4800]/10 focus-within:shadow-[0_0_30px_rgba(255,72,0,0.15)] ${
                  errors.email ? "!border-red-500/50 bg-red-500/5" : ""
                }`}
              >
                <div className="p-2.5 bg-white/5 rounded-xl group-focus-within:bg-[#ff4800]/20 group-focus-within:rotate-12 transition-all duration-500">
                  <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-[#ff4800] transition-colors" />
                </div>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  className="bg-transparent text-white w-full outline-none placeholder-gray-600 font-medium text-lg"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-2 ml-1 flex items-center gap-1.5 font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#ff4800] to-[#ff6a3d] hover:from-[#ff5500] hover:to-[#ff7b52] text-white py-4 text-lg font-bold rounded-2xl shadow-lg shadow-orange-900/30 transform hover:-translate-y-1 hover:shadow-orange-900/50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none my-5"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <Wrench className="w-6 h-6 animate-spin" />
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>

            {/* Back to Login Link */}
            <div className="text-center pt-4 border-t border-white/5">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </form>
        </Tabs.Root>
      </div>
    </div>
  );
}
