"use client";

import { useTranslations } from "next-intl";
import { Shield, Award, Users, PenTool } from "lucide-react";

export default function TrustedBy() {
  const t = useTranslations("Home");

  // Mock partners using Icons and Text as I don't have logo assets
  const partners = [
    { name: "AutoFix", icon: Wrench },
    { name: "City Towing", icon: Users },
    { name: "Premium Parts", icon: PenTool }, // using random icons for demo
    { name: "Verified Mech", icon: Award },
    { name: "Secure Drive", icon: Shield },
  ];

  function Wrench(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    );
  }

  return (
    <section className="py-12 border-b border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/5" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">
          Trusted by top automotive partners
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap justify-center items-center gap-x-8 gap-y-12 lg:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 group cursor-pointer"
            >
              <partner.icon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 group-hover:text-orange-500 transition-colors duration-300" />
              <span className="text-base sm:text-xl font-bold text-gray-400 group-hover:text-white transition-colors duration-300">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
