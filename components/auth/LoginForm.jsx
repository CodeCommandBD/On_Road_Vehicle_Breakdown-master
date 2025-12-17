"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

export default function LoginForm() {
  const [activeTab, setActiveTab] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
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
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role: activeTab }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }

      dispatch(loginSuccess(result));
      toast.success(`Welcome back, ${result.user.name}!`);

      // Redirect based on role
      if (result.user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/"); // Redirect to home page for users
      }
    } catch (error) {
      dispatch(loginFailure(error.message));
      toast.error(error.message);
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    reset();
  };

  return (
    <div className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8! sm:p-12! relative z-10 overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-20 -right-20 p-4! opacity-20 pointer-events-none">
        <div className="w-64 h-64 bg-[#ff4800] rounded-full blur-[100px]"></div>
      </div>
      <div className="absolute -bottom-20 -left-20 p-4! opacity-10! pointer-events-none">
        <div className="w-64 h-64 bg-blue-600 rounded-full blur-[100px]"></div>
      </div>

      <div className="text-center mb-10 relative z-10">
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight drop-shadow-lg">
          WELCOME <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4800] to-[#ff8800]">
            QUICK SERVICE
          </span>
        </h1>
        <p className="text-gray-400 text-base font-medium my-4!">
          Securely access your dashboard
        </p>
      </div>

      <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
        <Tabs.List className="flex gap-4! mb-10! bg-black/30! p-1.5! rounded-2xl!  border border-white/5! shadow-inner">
          <Tabs.Trigger
            value="user"
            className={`flex-1 flex items-center justify-center gap-2! py-3.5! px-4! rounded-xl! transition-all duration-300 ${
              activeTab === "user"
                ? "bg-gradient-to-r from-[#ff4800] to-[#ff6a3d] text-white shadow-lg shadow-orange-900/40 transform scale-[1.02]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <User
              className={`w-5 h-5 ${
                activeTab === "user" ? "fill-white" : "fill-current"
              }`}
            />
            <span className="font-bold text-sm tracking-wide">USER</span>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="garage"
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl transition-all duration-300 ${
              activeTab === "garage"
                ? "bg-gradient-to-r from-[#ff4800] to-[#ff6a3d] text-white shadow-lg shadow-orange-900/40 transform scale-[1.02]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Wrench
              className={`w-5 h-5 ${
                activeTab === "garage" ? "fill-white" : "fill-current"
              }`}
            />
            <span className="font-bold text-sm tracking-wide">GARAGE</span>
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
              className={`group flex items-center gap-4 bg-black/30 border border-white/5 rounded-2xl p-4!  my-2! transition-all duration-300 hover:bg-black/40 focus-within:bg-black/50 focus-within:border-[#ff4800] focus-within:ring-1 focus-within:ring-[#ff4800]/50 focus-within:shadow-[0_0_20px_rgba(255,72,0,0.1)] ${
                errors.email ? "!border-red-500 bg-red-500/5" : ""
              }`}
            >
              <div className="p-2 bg-white/5 rounded-lg group-focus-within:bg-[#ff4800]/20 transition-colors">
                <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-[#ff4800] transition-colors" />
              </div>
              <input
                type="email"
                placeholder={
                  activeTab === "user"
                    ? "user@example.com"
                    : "garage@business.com"
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
              Password
            </label>
            <div
              className={`group flex items-center gap-4 bg-black/30 border border-white/5 rounded-2xl p-4! my-2! transition-all duration-300 hover:bg-black/40 focus-within:bg-black/50 focus-within:border-[#ff4800] focus-within:ring-1 focus-within:ring-[#ff4800]/50 focus-within:shadow-[0_0_20px_rgba(255,72,0,0.1)] ${
                errors.password ? "!border-red-500 bg-red-500/5" : ""
              }`}
            >
              <div className="p-2 bg-white/5 rounded-lg group-focus-within:bg-[#ff4800]/20 transition-colors">
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
                onCheckedChange={(checked) => {
                  // handle remember me logic
                }}
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
              Forgot Password?
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
                Authenticating...
              </span>
            ) : (
              "Login Securely"
            )}
          </button>

          {/* Sign Up Link */}
          <div className="text-center pt-4 border-t border-white/5">
            <p className="text-gray-400 font-medium">
              New here?{" "}
              <Link
                href="/signup"
                className="text-white font-bold hover:text-[#ff4800] transition-colors ml-1"
              >
                Create an account
              </Link>
            </p>
          </div>
        </form>
      </Tabs.Root>
    </div>
  );
}
