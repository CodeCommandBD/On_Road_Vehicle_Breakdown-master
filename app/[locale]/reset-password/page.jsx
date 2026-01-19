"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Lock,
  Wrench,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "@/lib/axios";

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState(null);
  const router = useRouterWithLoading(); // Regular routing
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      toast.error("Invalid reset link");
      router.push("/login");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data) => {
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.post("/auth/reset-password", {
        token,
        newPassword: data.newPassword,
      });

      const result = response.data;

      setResetSuccess(true);
      toast.success("Password reset successful!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-12 relative z-10 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-green-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

          <div className="text-center relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">
              Password Reset Successful!
            </h1>

            <p className="text-gray-400 mb-8">
              Your password has been successfully reset. You can now login with
              your new password.
            </p>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8">
              <p className="text-sm text-blue-400">
                Redirecting to login page in 3 seconds...
              </p>
            </div>

            <Link
              href="/login"
              className="inline-block bg-gradient-to-r from-[#ff4800] to-[#ff6a3d] text-white px-8 py-3 rounded-xl font-bold hover:from-[#ff5500] hover:to-[#ff7b52] transition-all"
            >
              Go to Login Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-12 relative z-10">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">
              Invalid Reset Link
            </h1>
            <p className="text-gray-400 mb-8">
              This password reset link is invalid or has expired.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block bg-gradient-to-r from-[#ff4800] to-[#ff6a3d] text-white px-8 py-3 rounded-xl font-bold hover:from-[#ff5500] hover:to-[#ff7b52] transition-all"
            >
              Request New Link
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
            Secure Reset
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-2xl">
            RESET
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4800] via-[#ff6a3d] to-[#ff8800]">
              PASSWORD
            </span>
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Enter your new password below
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8 relative z-10"
        >
          {/* New Password Field */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              New Password
            </label>
            <div
              className={`group flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-4 my-2 transition-all duration-500 hover:bg-white/[0.05] focus-within:bg-white/[0.08] focus-within:border-[#ff4800] focus-within:ring-4 focus-within:ring-[#ff4800]/10 focus-within:shadow-[0_0_30px_rgba(255,72,0,0.15)] ${
                errors.newPassword ? "!border-red-500/50 bg-red-500/5" : ""
              }`}
            >
              <div className="p-2.5 bg-white/5 rounded-xl group-focus-within:bg-[#ff4800]/20 group-focus-within:-rotate-12 transition-all duration-500">
                <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-[#ff4800] transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="bg-transparent text-white w-full outline-none placeholder-gray-600 font-medium text-lg tracking-widest"
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 text-gray-400 hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-400 text-xs mt-2 ml-1 flex items-center gap-1.5 font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400"></span>
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              Confirm Password
            </label>
            <div
              className={`group flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-4 my-2 transition-all duration-500 hover:bg-white/[0.05] focus-within:bg-white/[0.08] focus-within:border-[#ff4800] focus-within:ring-4 focus-within:ring-[#ff4800]/10 focus-within:shadow-[0_0_30px_rgba(255,72,0,0.15)] ${
                errors.confirmPassword ? "!border-red-500/50 bg-red-500/5" : ""
              }`}
            >
              <div className="p-2.5 bg-white/5 rounded-xl group-focus-within:bg-[#ff4800]/20 group-focus-within:-rotate-12 transition-all duration-500">
                <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-[#ff4800] transition-colors" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="bg-transparent text-white w-full outline-none placeholder-gray-600 font-medium text-lg tracking-widest"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="p-2 text-gray-400 hover:text-white transition-colors focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs mt-2 ml-1 flex items-center gap-1.5 font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400"></span>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-sm text-blue-400 font-semibold mb-2">
              Password Requirements:
            </p>
            <ul className="text-xs text-blue-300 space-y-1">
              <li>• At least 6 characters long</li>
              <li>• Must match the confirmation</li>
            </ul>
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
                Resetting Password...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>

          {/* Back to Login Link */}
          <div className="text-center pt-4 border-t border-white/5">
            <Link
              href="/login"
              className="text-gray-400 hover:text-white font-medium transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
