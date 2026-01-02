"use client";

import { useState } from "react";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Wrench,
  Mail,
  Lock,
  Loader2,
  Check,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { toast } from "react-toastify";
import * as Tabs from "@radix-ui/react-tabs";
import * as Checkbox from "@radix-ui/react-checkbox";
import {
  loginSuccess,
  loginFailure,
  setLoading,
  selectAuthLoading,
} from "@/store/slices/authSlice";

const loginSchema = z.object({
  email: z.string().min(1, "Email or Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

export default function LoginForm() {
  const t = useTranslations("Auth");
  const commonT = useTranslations("Common");
  const [activeTab, setActiveTab] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouterWithLoading(true); // true for i18n support
  const searchParams = useSearchParams();
  const redirectParams = searchParams.get("redirect");
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data) => {
    dispatch(setLoading(true));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role: activeTab }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }

      // Handle new API response format (data wrapper)
      const userData = result.data || result;

      dispatch(loginSuccess(result));
      toast.success(`Welcome back, ${userData.user?.name || "User"}!`);

      // Redirect based on role or return URL
      if (redirectParams) {
        // Strip duplicate locale if present in redirect URL (e.g., /en/en/...)
        // next-intl router automatically adds the current locale
        const cleanPath = redirectParams.replace(/^\/(en|bn)/, "") || "/";
        router.push(cleanPath);
      } else if (userData.user?.role === "admin") {
        router.push("/admin/dashboard");
      } else if (userData.user?.role === "garage") {
        router.push("/garage/dashboard");
      } else if (userData.user?.role === "mechanic") {
        router.push("/mechanic/dashboard");
      } else {
        router.push("/"); // Redirect to home page for users
      }
    } catch (error) {
      dispatch(loginFailure(error.message || "An unexpected error occurred"));
      toast.error(error.message || "Login failed");
    } finally {
      // Ensure loading is false if something weird happens (though dispatch should handle it)
      // actually dispatch handles it.
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    reset();
  };

  return (
    <div className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8! sm:p-12! relative z-10 overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#ff4800]/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div
        className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/[0.02] pointer-events-none rounded-3xl"></div>

      <div className="text-center mb-10 relative z-10">
        <div className="inline-block p-1 px-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em] mb-4 animate-pulse">
          Secure Authentication
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-2xl">
          WELCOME <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4800] via-[#ff6a3d] to-[#ff8800]">
            QUICK SERVICE
          </span>
        </h1>
        <p className="text-gray-500 text-sm font-medium">
          {t("authenticating")}
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
              {t("email")} / {commonT("phone")}
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
                type="text"
                placeholder={
                  activeTab === "user"
                    ? "Email or Phone (e.g. 017...)"
                    : activeTab === "mechanic"
                    ? "Mechanic Phone/Email"
                    : "Email or Phone number"
                }
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

          {/* Password Field */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              {t("password")}
            </label>
            <div
              className={`group flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-4 my-2 transition-all duration-500 hover:bg-white/[0.05] focus-within:bg-white/[0.08] focus-within:border-[#ff4800] focus-within:ring-4 focus-within:ring-[#ff4800]/10 focus-within:shadow-[0_0_30px_rgba(255,72,0,0.15)] ${
                errors.password ? "!border-red-500/50 bg-red-500/5" : ""
              }`}
            >
              <div className="p-2.5 bg-white/5 rounded-xl group-focus-within:bg-[#ff4800]/20 group-focus-within:-rotate-12 transition-all duration-500">
                <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-[#ff4800] transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="bg-transparent text-white w-full outline-none placeholder-gray-600 font-medium text-lg tracking-widest"
                {...register("password")}
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
            {errors.password && (
              <p className="text-red-400 text-xs mt-2 ml-1 flex items-center gap-1.5 font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400"></span>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between text-sm py-1 my-5!">
            <div className="flex items-center gap-3 group cursor-pointer">
              <Checkbox.Root
                className="flex h-5 w-5 appearance-none items-center justify-center rounded-md border border-gray-600 bg-black/40 shadow-sm outline-none data-[state=checked]:bg-[#ff4800] data-[state=checked]:border-[#ff4800] transition-all duration-200 group-hover:border-gray-500"
                id="remember"
                {...register("remember")}
              >
                <Checkbox.Indicator className="text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label
                htmlFor="remember"
                className="text-gray-400 font-medium cursor-pointer select-none group-hover:text-gray-300 transition-colors"
              >
                Remember me
              </label>
            </div>
            <Link
              href="/forgot-password"
              className="font-semibold text-[#ff4800] hover:text-[#ff8800] transition-colors hover:underline decoration-2 underline-offset-4"
            >
              {t("forgotPassword")}
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#ff4800] to-[#ff6a3d] hover:from-[#ff5500] hover:to-[#ff7b52] text-white py-4! text-lg font-bold rounded-2xl shadow-lg shadow-orange-900/30 transform hover:-translate-y-1 hover:shadow-orange-900/50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none my-5!"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                {t("authenticating")}
              </span>
            ) : (
              t("login")
            )}
          </button>

          {/* Sign Up Link */}
          <div className="text-center pt-4 border-t border-white/5">
            <p className="text-gray-400 font-medium">
              {t("noAccount")}{" "}
              <Link
                href="/signup"
                className="text-white font-bold hover:text-[#ff4800] transition-colors ml-1"
              >
                {t("signup")}
              </Link>
            </p>
          </div>
        </form>
      </Tabs.Root>
    </div>
  );
}
