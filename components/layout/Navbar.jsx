"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  logout,
  selectIsAuthenticated,
  selectUser,
  selectUserRole,
  loginSuccess,
} from "@/store/slices/authSlice";
import {
  selectUnreadNotificationsCount,
  setUnreadNotificationsCount,
} from "@/store/slices/uiSlice";
import { Bell, Menu, X } from "lucide-react";
import axios from "axios";
import { useTranslations } from "next-intl";
import SettingsModal from "@/components/common/SettingsModal";

const WaveText = ({ text }) => {
  return (
    <span className="inline-block transition-transform duration-300 ease-in-out">
      {text.split("").map((char, index) => (
        <span
          key={index}
          style={{ "--i": index + 1 }}
          className="inline-block transition-transform duration-300 ease-in-out group-hover:animate-[wave_0.3s_ease-in-out_forwards] group-hover:[animation-delay:calc(0.1s*var(--i))]"
        >
          {char}
        </span>
      ))}
    </span>
  );
};

export default function Navbar() {
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const notifyRef = useRef(null);

  const t = useTranslations();

  // Dynamic Services State
  const [services, setServices] = useState([]);

  const dispatch = useDispatch();
  const router = useRouterWithLoading(); // Regular routing
  const pathname = usePathname();

  // NextAuth session
  const { data: session, status } = useSession();

  // Redux state
  const isAuthenticatedRedux = useSelector(selectIsAuthenticated);
  const userRedux = useSelector(selectUser);
  const userRole = useSelector(selectUserRole);
  const unreadCount = useSelector(selectUnreadNotificationsCount);

  // Combine NextAuth session with Redux state
  const isAuthenticated = status === "authenticated" || isAuthenticatedRedux;
  const user = session?.user || userRedux;

  // Fetch Services on Mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(
          "/api/services?limit=12&isActive=true&sort=order"
        );
        const data = await response.json();
        if (data.success) {
          setServices(data.data.services || []);
        }
      } catch (error) {
        console.error("Failed to fetch services:", error);
      }
    };
    fetchServices();
  }, []);

  // Fetch Notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("/api/notifications");
        if (res.data.success) {
          setNotifications(res.data.notifications);
          dispatch(setUnreadNotificationsCount(res.data.unreadCount));
        }
      } catch (err) {
        console.error("Failed to fetch notifications in navbar:", err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setIsNotifyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // Sign out from NextAuth (for OAuth users)
      await signOut({ redirect: false });
      // Clear Redux store (for credentials users)
      dispatch(logout());
      // Redirect to home
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const markNotifyRead = async () => {
    try {
      await axios.patch("/api/notifications", { markAllAsRead: true });
      dispatch(setUnreadNotificationsCount(0));
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  return (
    <>
      <nav className="px-4 lg:px-20 h-[70px] sticky top-0 w-full z-[999] bg-[#020617] transition-all duration-400 flex items-center justify-between">
        {/* Mobile Menu Button - Left Side */}
        <button
          className="md:hidden text-white p-2 -ml-2 hover:text-[#ff4800] transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-transform duration-300 hover:scale-105"
        >
          <Image
            src="/images/nav/main-logo.svg"
            alt="Logo"
            width={120}
            height={40}
            className="h-[35px] md:h-[50px] w-auto drop-shadow-[0_0_15px_rgba(255,72,0,0.5)] transition-all duration-300 group-hover:drop-shadow-[0_0_25px_rgba(255,72,0,0.8)]"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <ul className="flex gap-[30px] items-center p-0 m-0 list-none">
            <li>
              <Link
                href="/"
                className="group inline-block text-[18px] font-semibold cursor-pointer relative text-white no-underline transition-colors duration-300 hover:text-[#ff4800]"
              >
                <WaveText text="HOME" />
              </Link>
            </li>
            <li>
              <Link
                href="/garages"
                className="group inline-block text-[18px] font-semibold cursor-pointer relative text-white no-underline transition-colors duration-300 hover:text-[#ff4800]"
              >
                <WaveText text="FIND GARAGE" />
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="group inline-block text-[18px] font-semibold cursor-pointer relative text-white no-underline transition-colors duration-300 hover:text-[#ff4800]"
              >
                <WaveText text="ABOUT" />
              </Link>
            </li>
            <li className="relative group">
              <div
                className="flex items-center gap-[5px] bg-none border-none cursor-pointer"
                onClick={() => setIsServicesOpen(!isServicesOpen)}
              >
                <span className="group inline-block text-[18px] font-semibold cursor-pointer relative text-white no-underline transition-colors duration-300 hover:text-[#ff4800]">
                  <WaveText text="SERVICES" />
                </span>
                <span className="text-[23px] text-[#ff4800] font-bold ml-[7px] transition-all duration-300 ease-in-out">
                  {isServicesOpen ? "-" : "+"}
                </span>
              </div>

              {isServicesOpen && (
                <div
                  className={`absolute top-[80px] left-1/2 -translate-x-1/2 min-w-[600px] bg-[#141414fa] backdrop-blur-[20px] border border-[#ff480033] rounded-xl p-[30px] text-[18px] font-semibold shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,72,0,0.1)] z-[1000] overflow-hidden transition-all duration-500 ease-in-out ${
                    isServicesOpen
                      ? "opacity-100 max-h-[500px] translate-y-0"
                      : "opacity-0 max-h-0 -translate-y-[15px]"
                  }`}
                >
                  <div className="grid grid-cols-2 gap-[15px] p-[10px] max-h-[400px] overflow-y-auto custom-scrollbar">
                    {services.length > 0 ? (
                      services.map((service, index) => (
                        <Link
                          key={service._id || index}
                          href={`/garages?service=${service.slug}`}
                          className="flex items-center gap-[12px] p-[12px] rounded-[8px] transition-all duration-300 cursor-pointer border border-transparent hover:bg-[#ff48001a] hover:border-[#ff48004d] hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(255,72,0,0.2)] group/item"
                          onClick={() => setIsServicesOpen(false)}
                        >
                          <Image
                            src={service.image || "/images/nav/nav-one.png"}
                            alt={service.name}
                            width={40}
                            height={40}
                            className="w-[45px] h-[45px] p-[8px] bg-[#ff48001a] rounded-[8px] transition-all duration-300 group-hover/item:bg-[#ff480033] group-hover/item:rotate-[5deg] group-hover/item:scale-110 object-contain"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white text-[15px] font-semibold mb-[4px] transition-colors duration-300 whitespace-nowrap overflow-hidden text-ellipsis group-hover/item:text-[#ff4800]">
                              {service.name}
                            </h4>
                            <p className="text-[#ffffff99] text-[11px] font-normal m-0 whitespace-nowrap overflow-hidden text-ellipsis">
                              {service.category || "General Service"}
                            </p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="col-span-2 text-center text-white/50 py-4">
                        No services available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-2 md:gap-[28px]">
          {/* Notifications */}
          {isAuthenticated && (
            <div className="relative" ref={notifyRef}>
              <button
                onClick={() => {
                  setIsNotifyOpen(!isNotifyOpen);
                  if (!isNotifyOpen && unreadCount > 0) markNotifyRead();
                }}
                className="relative p-2 text-white/70 hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5 md:w-6 md:h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ff4800] rounded-full border-2 border-[#020617]"></span>
                )}
              </button>

              {isNotifyOpen && (
                <div className="absolute top-[50px] md:top-[60px] right-[-60px] md:right-0 bg-[#141414fa] backdrop-blur-[20px] border border-[#ff48004d] rounded-[16px] w-[280px] md:min-w-[300px] shadow-2xl z-[1000] overflow-hidden transition-all duration-300">
                  <div className="p-4 border-b border-[#ff480033] flex justify-between items-center bg-[#ff48001a]">
                    <h4 className="text-white text-sm font-bold">
                      Notifications
                    </h4>
                    <span className="text-[10px] text-[#ff4800] uppercase font-bold tracking-wider">
                      {unreadCount} NEW
                    </span>
                  </div>
                  <div className="max-h-80 md:max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => {
                            if (n.link) router.push(n.link);
                            setIsNotifyOpen(false);
                          }}
                          className="p-3 md:p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                          <p className="text-xs font-bold text-white mb-1 group-hover:text-[#ff4800]">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-white/50 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[9px] text-white/30 mt-2">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-white/40 italic text-sm">
                        No new notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile / Login */}
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <div
                className="relative cursor-pointer flex items-center gap-[10px]"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-[32px] h-[32px] md:w-[40px] md:h-[40px] rounded-full border-[2px] border-[#ff4800] shadow-[0_0_0_4px_rgba(255,72,0,0.2)] transition-all duration-300 overflow-hidden hover:border-white hover:shadow-[0_0_0_6px_rgba(255,72,0,0.3),0_0_20px_rgba(255,72,0,0.5)] hover:scale-110">
                  <Image
                    src={user.avatar || "/images/users/default-avatar.jpg"}
                    alt="User"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/images/users/default-avatar.jpg";
                    }}
                  />
                </div>
              </div>

              {/* Profile Dropdown */}
              <div
                className={`absolute top-[50px] md:top-[60px] right-0 bg-[#141414fa] bg-gradient-to-br from-[#141414fa] to-[#1e1e1ef2] backdrop-blur-[20px] border border-[#ff48004d] rounded-[16px] min-w-[260px] md:min-w-[280px] max-h-[80vh] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,72,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden z-[1000] transition-all duration-300 cubic-bezier(0.4,0,0.2,1) ${
                  isProfileOpen
                    ? "opacity-100 visible translate-y-0 scale-100"
                    : "opacity-0 invisible -translate-y-[15px] scale-95"
                }`}
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff480080] to-transparent"></div>

                <div className="p-[15px] md:p-[20px] bg-gradient-to-br from-[#ff48001a] to-[#ff48000d] border-b border-[#ff480033] relative">
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff480080] to-transparent"></div>
                  <h4 className="text-white text-[15px] md:text-[17px] font-bold mb-[6px] tracking-[0.3px]">
                    {user.name}
                  </h4>
                  <p className="text-[#ffffff99] text-[12px] md:text-[13px] mb-[8px] whitespace-nowrap overflow-hidden text-ellipsis">
                    {user.email}
                  </p>
                  <span className="inline-block bg-gradient-to-br from-[#ff4800] to-[#ff6a3d] text-white text-[11px] font-semibold px-[12px] py-[4px] rounded-[12px] mt-[2px] capitalize shadow-[0_2px_8px_rgba(255,72,0,0.3)] tracking-[0.5px]">
                    {userRole}
                  </span>
                </div>

                <div className="p-[10px] flex flex-col gap-[8px] md:gap-[10px] max-h-[50vh] overflow-y-auto custom-scrollbar">
                  <Link
                    href={
                      userRole === "admin"
                        ? "/admin/dashboard"
                        : userRole === "garage"
                        ? "/garage/dashboard"
                        : "/user/dashboard"
                    }
                    className="flex gap-[14px] items-center p-[10px_14px] md:p-[12px_16px] text-[#ffffffe6] text-[13px] md:text-[14px] font-medium transition-all duration-300 rounded-[10px] my-[2px] md:my-[4px_0] relative overflow-hidden group/item hover:bg-gradient-to-r hover:from-[#ff480026] hover:to-[#ff48000d] hover:text-[#ff6a3d] hover:translate-x-[4px] hover:pl-[20px]"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <span className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-[#ff4800] to-[#ff6a3d] scale-y-0 transition-transform duration-300 group-hover/item:scale-y-100"></span>
                    <div className="w-[20px] h-[20px] min-w-[20px] flex items-center justify-center rounded-[6px] bg-[#ff48001a] p-[4px] transition-all duration-300 flex-shrink-0 group-hover/item:bg-[#ff480033] group-hover/item:rotate-[5deg] group-hover/item:scale-110">
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                    </div>
                    Dashboard
                  </Link>

                  <Link
                    href={
                      userRole === "admin"
                        ? "/admin/dashboard"
                        : userRole === "garage"
                        ? "/garage/dashboard/profile"
                        : "/user/dashboard/profile"
                    }
                    className="flex gap-[14px] items-center p-[10px_14px] md:p-[12px_16px] text-[#ffffffe6] text-[13px] md:text-[14px] font-medium transition-all duration-300 rounded-[10px] my-[2px] md:my-[4px_0] relative overflow-hidden group/item hover:bg-gradient-to-r hover:from-[#ff480026] hover:to-[#ff48000d] hover:text-[#ff6a3d] hover:translate-x-[4px] hover:pl-[20px]"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <span className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-[#ff4800] to-[#ff6a3d] scale-y-0 transition-transform duration-300 group-hover/item:scale-y-100"></span>
                    <div className="w-[20px] h-[20px] min-w-[20px] flex items-center justify-center rounded-[6px] bg-[#ff48001a] p-[4px] transition-all duration-300 flex-shrink-0 group-hover/item:bg-[#ff480033] group-hover/item:rotate-[5deg] group-hover/item:scale-110">
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    Profile Settings
                  </Link>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="flex w-full gap-[14px] items-center p-[10px_14px] md:p-[12px_16px] text-[#ffffffe6] text-[13px] md:text-[14px] font-medium transition-all duration-300 rounded-[10px] my-[2px] md:my-[4px_0] relative overflow-hidden group/item hover:bg-gradient-to-r hover:from-[#ff480026] hover:to-[#ff48000d] hover:text-[#ff6a3d] hover:translate-x-[4px] hover:pl-[20px]"
                  >
                    <span className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-[#ff4800] to-[#ff6a3d] scale-y-0 transition-transform duration-300 group-hover/item:scale-y-100"></span>
                    <div className="w-[20px] h-[20px] min-w-[20px] flex items-center justify-center rounded-[6px] bg-[#ff48001a] p-[4px] transition-all duration-300 flex-shrink-0 group-hover/item:bg-[#ff480033] group-hover/item:rotate-[5deg] group-hover/item:scale-110">
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m5.196-13.196l-4.242 4.242m0 6.364l4.242 4.242M23 12h-6m-6 0H1m18.196 5.196l-4.242-4.242m0-6.364l4.242-4.242"></path>
                      </svg>
                    </div>
                    {t("Navigation.settings")}
                  </button>

                  <div className="h-[1px] bg-gradient-to-r from-transparent via-[#ff48004d] to-transparent m-[10px]"></div>

                  <button
                    onClick={handleLogout}
                    className="flex w-full gap-[14px] items-center p-[10px_14px] md:p-[12px_16px] text-[#ffffffe6] text-[13px] md:text-[14px] font-medium transition-all duration-300 rounded-[10px] my-[2px] md:my-[4px_0] relative overflow-hidden group/item hover:bg-gradient-to-r hover:from-[#ff480026] hover:to-[#ff48000d] hover:text-[#ff6a3d] hover:translate-x-[4px] hover:pl-[20px]"
                  >
                    <span className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-[#ff4800] to-[#ff6a3d] scale-y-0 transition-transform duration-300 group-hover/item:scale-y-100"></span>
                    <div className="w-[20px] h-[20px] min-w-[20px] flex items-center justify-center rounded-[6px] bg-[#ff48001a] p-[4px] transition-all duration-300 flex-shrink-0 group-hover/item:bg-[#ff480033] group-hover/item:rotate-[5deg] group-hover/item:scale-110">
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                    </div>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Dynamic CTA Button */}
          <Link
            href={
              isAuthenticated
                ? userRole === "admin"
                  ? "/admin/dashboard"
                  : userRole === "garage"
                  ? "/garage/dashboard"
                  : "/book"
                : "/login"
            }
            className="inline-block text-white px-[15px] py-[8px] text-[12px] md:px-[50px] md:py-[12px] md:text-[16px] bg-[#ff4800] rounded-[7px] font-medium tracking-[0.5px] transition-all duration-300 relative z-10 animate-[pulse-glow_2s_infinite] hover:bg-[#cb2500] hover:animate-none hover:-translate-y-[2px]"
          >
            {isAuthenticated
              ? userRole === "admin"
                ? "Admin"
                : userRole === "garage"
                ? "Dashboard"
                : "Book Service"
              : "Login"}
          </Link>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[998] md:hidden transition-all duration-300 ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
        <div
          className={`absolute top-0 left-0 w-[280px] h-full bg-[#0d0f19] border-r border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-6 border-b border-white/10">
            <Image
              src="/images/nav/main-logo.svg"
              alt="Logo"
              width={140}
              height={50}
              className="h-[40px] w-auto"
            />
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="flex flex-col">
              <Link
                href="/"
                className="px-6 py-4 text-white font-medium hover:bg-white/5 border-l-4 border-transparent hover:border-[#ff4800] transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                HOME
              </Link>
              <Link
                href="/garages"
                className="px-6 py-4 text-white font-medium hover:bg-white/5 border-l-4 border-transparent hover:border-[#ff4800] transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FIND GARAGE
              </Link>
              <Link
                href="/about"
                className="px-6 py-4 text-white font-medium hover:bg-white/5 border-l-4 border-transparent hover:border-[#ff4800] transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ABOUT
              </Link>

              <div className="px-6 py-4 text-white font-medium hover:bg-white/5 border-l-4 border-transparent hover:border-[#ff4800] transition-all cursor-pointer">
                <div
                  className="flex justify-between items-center"
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                >
                  SERVICES
                  <span className="text-[#ff4800] text-xl font-bold">
                    {isServicesOpen ? "-" : "+"}
                  </span>
                </div>

                {/* Mobile Services Dropdown */}
                {isServicesOpen && (
                  <div className="mt-4 pl-4 space-y-3">
                    {services.map((service, index) => (
                      <Link
                        key={index}
                        href={`/garages?service=${service.slug}`}
                        className="block text-sm text-white/70 hover:text-[#ff4800]"
                        onClick={() => {
                          setIsServicesOpen(false);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        {service.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/10">
            <p className="text-white/40 text-xs text-center">
              &copy; 2025 Vehicle Breakdown
            </p>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
