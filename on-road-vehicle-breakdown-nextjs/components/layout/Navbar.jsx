"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import {
  logout,
  selectIsAuthenticated,
  selectUser,
  selectUserRole,
} from "@/store/slices/authSlice";

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

const servicesData = {
  cars: [
    {
      title: "Windshields",
      description: "Service description",
      imgSrc: "/images/nav/nav-one.png",
    },
    {
      title: "Door",
      description: "Service description",
      imgSrc: "/images/nav/nav-two.png",
    },
    {
      title: "Air Condition",
      description: "Service description",
      imgSrc: "/images/nav/nav-three.png",
    },
    {
      title: "Batteries",
      description: "Service description",
      imgSrc: "/images/nav/nav-four.png",
    },
    {
      title: "Brake",
      description: "Service description",
      imgSrc: "/images/nav/nav-five.png",
    },
    {
      title: "Car Check",
      description: "Service description",
      imgSrc: "/images/nav/nav-six.png",
    },
    {
      title: "Oil Change",
      description: "Service description",
      imgSrc: "/images/nav/nav-seven.png",
    },
    {
      title: "Suspension",
      description: "Service description",
      imgSrc: "/images/nav/nav-eight.png",
    },
  ],
  bikes: [
    {
      title: "Windshields",
      description: "Service description",
      imgSrc: "/images/nav/nav-one.png",
    },
    {
      title: "Door",
      description: "Service description",
      imgSrc: "/images/nav/nav-two.png",
    },
    {
      title: "Air Condition",
      description: "Service description",
      imgSrc: "/images/nav/nav-three.png",
    },
    {
      title: "Batteries",
      description: "Service description",
      imgSrc: "/images/nav/nav-four.png",
    },
    {
      title: "Brake",
      description: "Service description",
      imgSrc: "/images/nav/nav-five.png",
    },
    {
      title: "Bike Check",
      description: "Service description",
      imgSrc: "/images/nav/nav-six.png",
    },
    {
      title: "Oil Change",
      description: "Service description",
      imgSrc: "/images/nav/nav-seven.png",
    },
    {
      title: "Suspension",
      description: "Service description",
      imgSrc: "/images/nav/nav-eight.png",
    },
  ],
};

export default function Navbar() {
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [activeServiceTab, setActiveServiceTab] = useState("cars");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const userRole = useSelector(selectUserRole);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      dispatch(logout());
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <nav className="px-5 lg:px-20 h-[70px] sticky top-0 w-full z-[999] bg-[#111] transition-all duration-400 flex items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-3 transition-transform duration-300 hover:scale-105"
        >
          <Image
            src="/images/nav/main-logo.svg"
            alt="Logo"
            width={150}
            height={50}
            className="h-[50px] w-auto drop-shadow-[0_0_15px_rgba(255,72,0,0.5)] transition-all duration-300 group-hover:drop-shadow-[0_0_25px_rgba(255,72,0,0.8)]"
            priority
          />
        </Link>

        <div>
          <ul className="hidden md:flex gap-[30px] items-center p-0 m-0 list-none">
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
                href="/about"
                className="group inline-block text-[18px] font-semibold cursor-pointer relative text-white no-underline transition-colors duration-300 hover:text-[#ff4800]"
              >
                <WaveText text="ABOUT" />
              </Link>
            </li>
            <li className="relative group">
              <div className="flex items-center gap-[5px] bg-none border-none cursor-pointer">
                <span className="group inline-block text-[18px] font-semibold cursor-pointer relative text-white no-underline transition-colors duration-300 hover:text-[#ff4800]">
                  <WaveText text="SERVICES" />
                </span>
                <button
                  className="text-[23px] text-[#ff4800] font-bold ml-[7px] transition-all duration-300 ease-in-out"
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                  onMouseEnter={() => setIsServicesOpen(true)}
                >
                  {isServicesOpen ? "-" : "+"}
                </button>
              </div>

              {isServicesOpen && (
                <div
                  className={`absolute top-[80px] left-1/2 -translate-x-1/2 flex gap-[40px] min-w-[800px] bg-[#141414fa] backdrop-blur-[20px] border border-[#ff480033] rounded-xl p-[30px] text-[18px] font-semibold shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,72,0,0.1)] z-[1000] overflow-hidden transition-all duration-500 ease-in-out ${
                    isServicesOpen
                      ? "opacity-100 max-h-[500px] translate-y-0"
                      : "opacity-0 max-h-0 -translate-y-[15px]"
                  }`}
                  onMouseLeave={() => setIsServicesOpen(false)}
                >
                  <div className="flex flex-col gap-[15px] min-w-[180px] p-[20px] bg-[#ff48000d] rounded-[10px] border-r-[2px] border-[#ff48004d]">
                    <button
                      className={`bg-none border-none p-[12px_20px] cursor-pointer text-left text-[20px] font-bold tracking-[1px] rounded-[8px] transition-all duration-300 relative overflow-hidden group/tab ${
                        activeServiceTab === "cars"
                          ? "text-[#ff4800] bg-[#ff480026]"
                          : "text-[#ffffffb3] hover:text-[#ff4800] hover:bg-[#ff48001a] hover:translate-x-[5px]"
                      }`}
                      onClick={() => setActiveServiceTab("cars")}
                    >
                      <span
                        className={`absolute left-0 top-0 h-full w-[4px] bg-[#ff4800] scale-y-0 transition-transform duration-300 group-hover/tab:scale-y-100 ${
                          activeServiceTab === "cars" ? "scale-y-100" : ""
                        }`}
                      ></span>
                      <WaveText text="CARS" />
                    </button>
                    <button
                      className={`bg-none border-none p-[12px_20px] cursor-pointer text-left text-[20px] font-bold tracking-[1px] rounded-[8px] transition-all duration-300 relative overflow-hidden group/tab ${
                        activeServiceTab === "bikes"
                          ? "text-[#ff4800] bg-[#ff480026]"
                          : "text-[#ffffffb3] hover:text-[#ff4800] hover:bg-[#ff48001a] hover:translate-x-[5px]"
                      }`}
                      onClick={() => setActiveServiceTab("bikes")}
                    >
                      <span
                        className={`absolute left-0 top-0 h-full w-[4px] bg-[#ff4800] scale-y-0 transition-transform duration-300 group-hover/tab:scale-y-100 ${
                          activeServiceTab === "bikes" ? "scale-y-100" : ""
                        }`}
                      ></span>
                      <WaveText text="BIKES" />
                    </button>
                  </div>

                  <div className="w-[1px] h-auto bg-gradient-to-b from-transparent via-[#ff480080] to-transparent"></div>

                  <div className="grid grid-cols-4 gap-[15px] p-[10px]">
                    {servicesData[activeServiceTab].map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-[12px] p-[12px] rounded-[8px] transition-all duration-300 cursor-pointer border border-transparent hover:bg-[#ff48001a] hover:border-[#ff48004d] hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(255,72,0,0.2)] group/item"
                      >
                        <Image
                          src={service.imgSrc}
                          alt={service.title}
                          width={40}
                          height={40}
                          className="w-[45px] h-[45px] p-[8px] bg-[#ff48001a] rounded-[8px] transition-all duration-300 group-hover/item:bg-[#ff480033] group-hover/item:rotate-[5deg] group-hover/item:scale-110"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-[15px] font-semibold mb-[4px] transition-colors duration-300 whitespace-nowrap overflow-hidden text-ellipsis group-hover/item:text-[#ff4800]">
                            {service.title}
                          </h4>
                          <p className="text-[#ffffff99] text-[11px] font-normal m-0 whitespace-nowrap overflow-hidden text-ellipsis">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-[15px] md:gap-[28px]">
          {/* Default Cart Icon */}
          <Link href="/cart" className="relative group">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-colors duration-300 group-hover:stroke-[#ff4800]"
            >
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span className="absolute -top-1 -right-1 bg-[#ff4800] text-white text-[10px] w-[15px] h-[15px] flex items-center justify-center rounded-full font-bold">
              0
            </span>
          </Link>

          {/* User Profile / Login */}
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <div
                className="relative cursor-pointer flex items-center gap-[10px]"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-[40px] h-[40px] rounded-full border-[2px] border-[#ff4800] shadow-[0_0_0_4px_rgba(255,72,0,0.2)] transition-all duration-300 overflow-hidden hover:border-white hover:shadow-[0_0_0_6px_rgba(255,72,0,0.3),0_0_20px_rgba(255,72,0,0.5)] hover:scale-110">
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
                className={`absolute top-[60px] right-0 bg-[#141414fa] bg-gradient-to-br from-[#141414fa] to-[#1e1e1ef2] backdrop-blur-[20px] border border-[#ff48004d] rounded-[16px] min-w-[280px] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,72,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden z-[1000] transition-all duration-300 cubic-bezier(0.4,0,0.2,1) ${
                  isProfileOpen
                    ? "opacity-100 visible translate-y-0 scale-100"
                    : "opacity-0 invisible -translate-y-[15px] scale-95"
                }`}
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff480080] to-transparent"></div>

                <div className="p-[20px] bg-gradient-to-br from-[#ff48001a] to-[#ff48000d] border-b border-[#ff480033] relative">
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff480080] to-transparent"></div>
                  <h4 className="text-white text-[17px] font-bold mb-[6px] tracking-[0.3px]">
                    {user.name}
                  </h4>
                  <p className="text-[#ffffff99] text-[13px] mb-[8px] whitespace-nowrap overflow-hidden text-ellipsis">
                    {user.email}
                  </p>
                  <span className="inline-block bg-gradient-to-br from-[#ff4800] to-[#ff6a3d] text-white text-[11px] font-semibold px-[12px] py-[4px] rounded-[12px] mt-[2px] capitalize shadow-[0_2px_8px_rgba(255,72,0,0.3)] tracking-[0.5px]">
                    {userRole}
                  </span>
                </div>

                <div className="p-[10px] flex flex-col gap-[10px]">
                  <Link
                    href={
                      userRole === "admin"
                        ? "/admin/dashboard"
                        : userRole === "garage"
                        ? "/garage/dashboard"
                        : "/user/dashboard"
                    }
                    className="flex gap-[14px] items-center p-[12px_16px] text-[#ffffffe6] text-[14px] font-medium transition-all duration-300 rounded-[10px] my-[4px_0] relative overflow-hidden group/item hover:bg-gradient-to-r hover:from-[#ff480026] hover:to-[#ff48000d] hover:text-[#ff6a3d] hover:translate-x-[4px] hover:pl-[20px]"
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
                    href="/profile"
                    className="flex gap-[14px] items-center p-[12px_16px] text-[#ffffffe6] text-[14px] font-medium transition-all duration-300 rounded-[10px] my-[4px_0] relative overflow-hidden group/item hover:bg-gradient-to-r hover:from-[#ff480026] hover:to-[#ff48000d] hover:text-[#ff6a3d] hover:translate-x-[4px] hover:pl-[20px]"
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

                  <div className="h-[1px] bg-gradient-to-r from-transparent via-[#ff48004d] to-transparent m-[10px]"></div>

                  <button
                    onClick={handleLogout}
                    className="flex w-full gap-[14px] items-center p-[12px_16px] text-[#ffffffe6] text-[14px] font-medium transition-all duration-300 rounded-[10px] my-[4px_0] relative overflow-hidden group/item hover:bg-gradient-to-r hover:from-[#ff480026] hover:to-[#ff48000d] hover:text-[#ff6a3d] hover:translate-x-[4px] hover:pl-[20px]"
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
                  ? "/admin"
                  : userRole === "garage"
                  ? "/dashboard"
                  : "/book"
                : "/login"
            }
            className="inline-block text-white px-[30px] py-[10px] text-[14px] md:px-[50px] md:py-[12px] md:text-[16px] bg-[#ff4800] rounded-[7px] font-medium tracking-[0.5px] transition-all duration-300 relative z-10 animate-[pulse-glow_2s_infinite] hover:bg-[#cb2500] hover:animate-none hover:-translate-y-[2px]"
          >
            {isAuthenticated
              ? userRole === "admin"
                ? "Admin Panel"
                : userRole === "garage"
                ? "Dashboard"
                : "Book Service"
              : "Login"}
          </Link>
        </div>
      </nav>
    </>
  );
}
