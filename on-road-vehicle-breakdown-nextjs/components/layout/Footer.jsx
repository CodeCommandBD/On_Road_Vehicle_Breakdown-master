"use client";

import Image from "next/image";
import Link from "next/link";
import { useScrollAnimationList } from "@/hooks/useScrollAnimation";

export default function Footer() {
  const socialAnimations = useScrollAnimationList(4);
  const linkAnimations = useScrollAnimationList(4);

  return (
    <>
      <div className="w-full min-h-screen flex items-end relative">
        <div className="absolute top-0 left-0 w-full h-[650px] overflow-hidden">
          <Image
            src="/images/footer/Footer-bg.png"
            alt="Footer background"
            fill
            style={{ objectFit: "cover" }}
          />
        </div>

        <div className="relative z-[2] w-full p-[30px_20px] md:p-[40px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-[30px] md:gap-[40px] mb-[40px]">
            {/* Service Column */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <div
                className={`flex gap-[15px] items-center mb-[25px] opacity-0 -translate-x-[80px] transition-all duration-[1000ms] ease-out ${
                  socialAnimations[0].isVisible
                    ? "opacity-100 translate-x-0"
                    : ""
                }`}
                ref={socialAnimations[0].ref}
              >
                {/* SVG Logo */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="50"
                  height="51"
                  viewBox="0 0 50 51"
                  fill="none"
                >
                  <rect
                    x="1"
                    y="1"
                    width="48"
                    height="48"
                    rx="11"
                    fill="url(#paint0_radial)"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <g filter="url(#filter0_d)">
                    <path
                      d="M39 32.4988C38.7315 33.8811 38.5533 34.5506 37.2685 36.2526C36.2385 37.254 34.2706 38.8055 32.5642 38.9215C33.8423 39.6565 38.5031 35.0564 39 32.4988Z"
                      fill="#F23C13"
                    />
                    <path
                      d="M23.3551 29.7422C20.345 30.529 17.0118 29.7561 14.6528 27.4035C11.9974 24.7591 11.3361 20.8836 12.6663 17.623L17.1258 22.0681L21.0493 21.0275L22.1021 17.1103L17.6414 12.6639C20.9113 11.3379 24.7994 11.9984 27.4535 14.644C29.8125 16.9966 30.5878 20.3178 29.796 23.3246L39 32.4988C38.7315 33.8811 38.5533 34.5506 37.2685 36.2526C36.2385 37.254 34.2706 38.8055 32.5642 38.9215L23.3551 29.7422Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <filter
                      id="filter0_d"
                      x="4"
                      y="8"
                      width="43"
                      height="43"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                      />
                      <feOffset dy="4" />
                      <feGaussianBlur stdDeviation="4" />
                      <feComposite in2="hardAlpha" operator="out" />
                      <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"
                      />
                      <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow"
                      />
                      <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow"
                        result="shape"
                      />
                    </filter>
                    <radialGradient
                      id="paint0_radial"
                      cx="0"
                      cy="0"
                      r="1"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="translate(25 25) rotate(90) scale(25)"
                    >
                      <stop stopColor="#FFA895" />
                      <stop offset="1" stopColor="#F23C13" />
                    </radialGradient>
                  </defs>
                </svg>
                <h2 className="text-white text-[26px] font-bold leading-[34px] [font-variant:small-caps] m-0 uppercase">
                  Service
                </h2>
              </div>

              <div className="max-w-[280px]">
                <p className="text-white text-justify text-[14px] font-medium mb-[32px]">
                  We provide online and integrated audio-visual solutions for
                  schools, government, and businesses, enhancing communication
                  and collaboration.
                </p>

                <div className="flex gap-[12px]">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      ref={socialAnimations[i].ref}
                      className={`opacity-0 translate-y-[20px] transition-all duration-[1000ms] ease-out cursor-pointer ${
                        socialAnimations[i].isVisible
                          ? "opacity-100 translate-y-0"
                          : ""
                      } ${
                        i === 1
                          ? "delay-[500ms]"
                          : i === 2
                          ? "delay-[1000ms]"
                          : i === 3
                          ? "delay-[1500ms]"
                          : ""
                      }`}
                    >
                      <Image
                        src="/images/footer/Facebook.png"
                        alt="Social"
                        width={32}
                        height={32}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Company Column */}
            <div className="col-span-1">
              <h3 className="text-white text-[16px] font-bold leading-[172%] mb-[20px]">
                Company
              </h3>
              <div
                ref={linkAnimations[0].ref}
                className={`flex flex-col gap-[15px] opacity-0 translate-x-[30px] transition-all duration-[1000ms] ease-out ${
                  linkAnimations[0].isVisible ? "opacity-100 translate-x-0" : ""
                }`}
              >
                <Link
                  href="/about"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  About
                </Link>
                <Link
                  href="/pricing"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Pricing
                </Link>
                <Link
                  href="/jobs"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Jobs
                </Link>
                <Link
                  href="/blog"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Blog
                </Link>
                <Link
                  href="/career"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Career
                </Link>
              </div>
            </div>

            {/* Product Column */}
            <div className="col-span-1">
              <h3 className="text-white text-[16px] font-bold leading-[172%] mb-[20px]">
                Product
              </h3>
              <div
                ref={linkAnimations[1].ref}
                className={`flex flex-col gap-[15px] opacity-0 translate-x-[30px] transition-all duration-[1000ms] ease-out ${
                  linkAnimations[1].isVisible ? "opacity-100 translate-x-0" : ""
                }`}
              >
                <Link
                  href="/details"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Details
                </Link>
                <Link
                  href="/features"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Features
                </Link>
                <Link
                  href="/privacy"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/status"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Status
                </Link>
                <Link
                  href="/api"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  API
                </Link>
              </div>
            </div>

            {/* Discover Column */}
            <div className="col-span-1">
              <h3 className="text-white text-[16px] font-bold leading-[172%] mb-[20px]">
                Discover
              </h3>
              <div
                ref={linkAnimations[2].ref}
                className={`flex flex-col gap-[15px] opacity-0 translate-x-[30px] transition-all duration-[1000ms] ease-out ${
                  linkAnimations[2].isVisible ? "opacity-100 translate-x-0" : ""
                }`}
              >
                <Link
                  href="/partner"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Partner Program
                </Link>
                <Link
                  href="/newsletter"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Newsletter
                </Link>
                <Link
                  href="/how-it-works"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  How it works
                </Link>
                <Link
                  href="/case-studies"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Case Studies
                </Link>
                <Link
                  href="/team"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Team of Service
                </Link>
              </div>
            </div>

            {/* Help Center Column */}
            <div className="col-span-1">
              <h3 className="text-white text-[16px] font-bold leading-[172%] mb-[20px]">
                Help Center
              </h3>
              <div
                ref={linkAnimations[3].ref}
                className={`flex flex-col gap-[15px] opacity-0 translate-x-[30px] transition-all duration-[1000ms] ease-out ${
                  linkAnimations[3].isVisible ? "opacity-100 translate-x-0" : ""
                }`}
              >
                <Link
                  href="/community"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Community
                </Link>
                <Link
                  href="/knowledge"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Knowledge
                </Link>
                <Link
                  href="/terms"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Terms & Condition
                </Link>
                <Link
                  href="/privacy"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Privacy
                </Link>
                <Link
                  href="/support"
                  className="text-white text-[14px] font-[400] leading-[160%] no-underline transition-colors duration-300 hover:text-[#FF532D]"
                >
                  Support
                </Link>
              </div>
            </div>
          </div>

          <div
            ref={linkAnimations[0].ref}
            className={`h-[2px] bg-white w-full opacity-0 translate-x-full transition-all duration-[1000ms] ease-out ${
              linkAnimations[0].isVisible ? "opacity-100 translate-x-0" : ""
            }`}
          ></div>

          <div className="text-center pt-[20px]">
            <p className="text-[#d1cdcd] text-[16px] font-[300] leading-[172%] m-0">
              © 2022. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
