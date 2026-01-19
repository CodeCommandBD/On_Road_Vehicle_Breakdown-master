"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Wrench,
  Mail,
  Lock,
  Phone,
  MapPin,
  Loader2,
  Home,
  Eye,
  EyeOff,
  Crosshair as LocateIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import * as Tabs from "@radix-ui/react-tabs";
import { useLocale } from "next-intl"; // Import useLocale
import axiosInstance from "@/lib/axios";
import {
  loginSuccess,
  loginFailure,
  setLoading,
  selectAuthLoading,
} from "@/store/slices/authSlice";

const signupSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(/^(\+88)?01[3-9]\d{8}$/, "Invalid Bangladeshi phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    garageName: z.string().optional(),
    address: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function SignupForm() {
  const locale = useLocale(); // Get current locale (en or bn)
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role");

  const [activeTab, setActiveTab] = useState(
    ["user", "garage"].includes(initialRole) ? initialRole : "user",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const router = useRouterWithLoading(); // Regular routing for signup
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      garageName: "",
      address: "",
    },
  });

  const handleAutoLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await axiosInstance.get(
            `/api/geocode?lat=${latitude}&lon=${longitude}&lang=${locale}`,
          );
          const data = response.data;

          if (data && data.display_name) {
            setValue("address", data.display_name);
            toast.success("Address fetched successfully!");
          } else {
            toast.error(data.error || "Could not find address from location");
            setValue("address", `Lat: ${latitude}, Lng: ${longitude}`);
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          toast.error("Failed to fetch address details");
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let msg = "Failed to get location";
        if (error.code === 1) msg = "Location permission denied";
        if (error.code === 2) msg = "Location unavailable";
        if (error.code === 3) msg = "Location request timed out";
        toast.error(msg);
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const onSubmit = async (data) => {
    if (activeTab === "garage" && (!data.garageName || !data.address)) {
      toast.error(
        "Garage name and address are required for garage registration",
      );
      return;
    }

    dispatch(setLoading(true));

    // Safety timeout to force reset loading state if everything else fails
    const safetyTimeout = setTimeout(() => {
      dispatch(setLoading(false));
    }, 20000); // 20s safety net

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduce to 10s for better UX

    try {
      const pathname = window.location.pathname;
      const lang = pathname.startsWith("/bn") ? "bn" : "en";

      const response = await axiosInstance.post("/api/auth/signup", {
        ...data,
        role: activeTab,
        lang,
      });

      toast.success(
        response.data.message || "Account created successfully! Please login.",
      );

      router.push(`/login?role=${activeTab}`);
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Signup failed";
      dispatch(loginFailure(message));
      toast.error(message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    reset();
  };

  return (
    <div className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8! sm:p-12! relative z-10 overflow-hidden my-8">
      {/* Decorative Glow */}
      <div className="absolute -top-20 -right-20 p-4! opacity-20 pointer-events-none">
        <div className="w-64 h-64 bg-[#ff4800] rounded-full blur-[100px]"></div>
      </div>
      <div className="absolute -bottom-20 -left-20 p-4! opacity-10! pointer-events-none">
        <div className="w-64 h-64 bg-blue-600 rounded-full blur-[100px]"></div>
      </div>

      <div className="text-center mb-10 relative z-10 top-0">
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight drop-shadow-lg">
          CREATE ACCOUNT <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4800] to-[#ff8800]">
            JOIN US
          </span>{" "}
          TODAY
        </h1>
        <p className="text-gray-400 text-base font-medium my-4!">
          Start your journey with QuickService
        </p>
      </div>

      <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
        <Tabs.List className="flex gap-4 my-5! bg-black/30 p-1.5 rounded-2xl border border-white/5 shadow-inner">
          <Tabs.Trigger
            value="user"
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl transition-all duration-300 ${
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
            <span className="font-bold text-sm tracking-wide p-4!">USER</span>
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
            <span className="font-bold text-sm tracking-wide p-4!">GARAGE</span>
          </Tabs.Trigger>
        </Tabs.List>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 relative z-10 text-left"
        >
          {/* Name Field */}
          <div className="space-y-2">
            <div
              className={`group flex items-center gap-4 bg-black/30 border border-white/5 rounded-2xl p-4! transition-all duration-300 hover:bg-black/40 focus-within:bg-black/50 focus-within:border-[#ff4800] focus-within:ring-1 focus-within:ring-[#ff4800]/50 focus-within:shadow-[0_0_20px_rgba(255,72,0,0.1)] ${
                errors.name ? "!border-red-500 bg-red-500/5" : ""
              }`}
            >
              <div className="p-2 bg-white/5 rounded-lg group-focus-within:bg-[#ff4800]/20 transition-colors ">
                <User className="w-5 h-5  text-gray-400 group-focus-within:text-[#ff4800] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Full Name"
                className="bg-transparent text-white w-full outline-none placeholder-gray-600 font-medium"
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="text-red-400 text-xs mt-1 ml-1">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Garage Specific Fields */}
          {activeTab === "garage" && (
            <>
              <div className="space-y-2">
                <div
                  className={`group flex items-center gap-4 bg-black/30 border border-white/5 rounded-2xl p-4! my-2! transition-all duration-300 hover:bg-black/40 focus-within:bg-black/50 focus-within:border-[#ff4800] focus-within:ring-1 focus-within:ring-[#ff4800]/50 ${
                    errors.garageName ? "!border-red-500" : ""
                  }`}
                >
                  <div className="p-2 bg-white/5 rounded-lg group-focus-within:bg-[#ff4800]/20 transition-colors">
                    <Home className="w-5 h-5 text-gray-400 group-focus-within:text-[#ff4800]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Garage Name"
                    className="bg-transparent text-white w-full outline-none placeholder-gray-600 font-medium"
                    {...register("garageName")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div
                  className={`group flex items-center gap-4 bg-black/30 border border-white/5 rounded-2xl p-4! my-2! transition-all duration-300 hover:bg-black/40 focus-within:bg-black/50 focus-within:border-[#ff4800] focus-within:ring-1 focus-within:ring-[#ff4800]/50 ${
                    errors.address ? "!border-red-500" : ""
                  }`}
                >
                  <div className="p-2 bg-white/5 rounded-lg group-focus-within:bg-[#ff4800]/20 transition-colors">
                    <MapPin className="w-5 h-5 text-gray-400 group-focus-within:text-[#ff4800]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Garage Address"
                    className="bg-transparent text-white w-full outline-none placeholder-gray-600 font-medium"
                    {...register("address")}
                  />
                  <button
                    type="button"
                    onClick={handleAutoLocation}
                    disabled={loadingLocation}
                    className="p-2 text-gray-400 hover:text-[#ff4800] transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Use current location"
                  >
                    {loadingLocation ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <LocateIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <div
              className={`group flex items-center gap-4 bg-black/30 border border-white/5 rounded-2xl p-4! my-2! transition-all duration-300 hover:bg-black/40 focus-within:bg-black/50 focus-within:border-[#ff4800] focus-within:ring-1 focus-within:ring-[#ff4800]/50 ${
                errors.email ? "!border-red-500 bg-red-500/5" : ""
              }`}
            >
              <div className="p-2 bg-white/5 rounded-lg group-focus-within:bg-[#ff4800]/20 transition-colors">
                <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-[#ff4800] transition-colors" />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                className="bg-transparent text-white w-full outline-none placeholder-gray-600 font-medium"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs mt-1 ml-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <div
              className={`group flex items-center gap-4 bg-black/30 border border-white/5 rounded-2xl p-4! my-2! transition-all duration-300 hover:bg-black/40 focus-within:bg-black/50 focus-within:border-[#ff4800] focus-within:ring-1 focus-within:ring-[#ff4800]/50 ${
                errors.phone ? "!border-red-500 bg-red-500/5" : ""
              }`}
            >
              <div className="p-2 bg-white/5 rounded-lg group-focus-within:bg-[#ff4800]/20 transition-colors">
                <Phone className="w-5 h-5 text-gray-400 group-focus-within:text-[#ff4800] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Phone Number"
                className="bg-transparent text-white w-full outline-none placeholder-gray-600 font-medium"
                {...register("phone")}
              />
            </div>
            {errors.phone && (
              <p className="text-red-400 text-xs mt-1 ml-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Password Field */}
            <div className="space-y-2">
              <div
                className={`group flex items-center gap-3 bg-black/30 border border-white/5 rounded-2xl p-4! my-2! transition-all duration-300 hover:bg-black/40 focus-within:bg-black/50 focus-within:border-[#ff4800] focus-within:ring-1 focus-within:ring-[#ff4800]/50 ${
                  errors.password ? "!border-red-500 bg-red-500/5" : ""
                }`}
              >
                <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-[#ff4800] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="bg-transparent text-white w-full outline-none placeholder-gray-600 font-medium text-sm"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-gray-400 hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1 ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div
                className={`group flex items-center gap-3 bg-black/30 border border-white/5 rounded-2xl p-4! my-2! transition-all duration-300 hover:bg-black/40 focus-within:bg-black/50 focus-within:border-[#ff4800] focus-within:ring-1 focus-within:ring-[#ff4800]/50 ${
                  errors.confirmPassword ? "!border-red-500 bg-red-500/5" : ""
                }`}
              >
                <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-[#ff4800] transition-colors" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm"
                  className="bg-transparent text-white w-full outline-none placeholder-gray-600 font-medium text-sm"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1 text-gray-400 hover:text-white transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1 ml-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#ff4800] to-[#ff6a3d] hover:from-[#ff5500] hover:to-[#ff7b52] text-white py-4! text-lg font-bold rounded-2xl shadow-lg shadow-orange-900/30 transform hover:-translate-y-1 hover:shadow-orange-900/50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none my-5!"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <Wrench className="w-6 h-6 animate-spin" />
                Creating Account...
              </span>
            ) : (
              "Sign Up Securely"
            )}
          </button>

          {/* Login Link */}
          <div className="text-center pt-4 border-t border-white/5">
            <p className="text-gray-400 font-medium">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-white font-bold hover:text-[#ff4800] transition-colors ml-1"
              >
                Login here
              </Link>
            </p>
          </div>
        </form>
      </Tabs.Root>
    </div>
  );
}
