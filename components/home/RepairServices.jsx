"use client";

import { useState } from "react";
import Image from "next/image";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import ServiceCard from "./ServiceCard";

const carServices = [
  { name: "Windshields", icon: "/images/nav/nav-one.png" },
  { name: "Door", icon: "/images/nav/nav-two.png" },
  { name: "Air Condition", icon: "/images/nav/nav-three.png" },
  { name: "Batteries", icon: "/images/nav/nav-four.png" },
  { name: "Brake", icon: "/images/nav/nav-five.png" },
  { name: "Car Check", icon: "/images/nav/nav-six.png" },
  { name: "Oil Change", icon: "/images/nav/nav-seven.png" },
  { name: "Suspension", icon: "/images/nav/nav-eight.png" },
  { name: "Tire", icon: "/images/nav/nav-nine.png" },
  { name: "Looking Glass", icon: "/images/nav/nav-ten.png" },
  { name: "Cleaning", icon: "/images/nav/nav-eleven.png" },
  { name: "Painting", icon: "/images/nav/nav-twelve.png" },
];

const bikeServices = [
  { name: "Windshields", icon: "/images/nav/nav-one.png" },
  { name: "Door", icon: "/images/nav/nav-two.png" },
  { name: "Air Condition", icon: "/images/nav/nav-three.png" },
  { name: "Batteries", icon: "/images/nav/nav-four.png" },
  { name: "Brake", icon: "/images/nav/nav-five.png" },
  { name: "Bike Check", icon: "/images/nav/nav-six.png" },
  { name: "Oil Change", icon: "/images/nav/nav-seven.png" },
  { name: "Suspension", icon: "/images/nav/nav-eight.png" },
  { name: "Tire", icon: "/images/nav/nav-nine.png" },
  { name: "Looking Glass", icon: "/images/nav/nav-ten.png" },
  { name: "Cleaning", icon: "/images/nav/nav-eleven.png" },
  { name: "Painting", icon: "/images/nav/nav-twelve.png" },
];

export default function RepairServices() {
  const [activeTab, setActiveTab] = useState("bikes");
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();

  const currentServices = activeTab === "cars" ? carServices : bikeServices;

  return (
    <section
      id="services"
      className="py-16 sm:py-20 md:py-24 lg:py-28 bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section - Centered */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Icon & Label */}
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <svg
              className="w-3 h-3 animate-[spin_8s_linear_infinite]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M0 9.11058C0.119355 9.72495 0.198523 10.0225 0.769556 10.7789C1.22733 11.224 2.10196 11.9136 2.86037 11.9651C2.29231 12.2918 0.220829 10.2473 0 9.11058Z"
                fill="#FF6644"
              />
              <path
                d="M6.95329 7.88544C8.29113 8.2351 9.77255 7.89161 10.821 6.846C12.0012 5.67073 12.2951 3.94825 11.7039 2.49909L9.72188 4.47471L7.97807 4.01223L7.51016 2.27123L9.49271 0.295053C8.03944 -0.294262 6.3114 -0.0007267 5.13177 1.1751C4.08335 2.22071 3.73875 3.69681 4.09067 5.03315L0 9.11058C0.119355 9.72495 0.198523 10.0225 0.769556 10.7789C1.22733 11.224 2.10196 11.9136 2.86037 11.9651L6.95329 7.88544Z"
                fill="#FF6644"
              />
            </svg>
            <h5 className="text-orange-600 text-xs font-semibold tracking-widest uppercase">
              Repair Services
            </h5>
          </div>

          {/* Title with Scroll Animation */}
          <h2
            ref={titleRef}
            className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900 transition-all duration-1000 ease-out ${
              titleVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-12"
            }`}
          >
            You Get Affordable <br className="hidden sm:block" />
            Repair Services
          </h2>
        </div>

        {/* Tabs - Centered */}
        <div className="flex justify-center gap-8 sm:gap-12 md:gap-16 mb-10 sm:mb-14">
          <button
            className={`relative bg-transparent text-xl sm:text-2xl md:text-3xl font-semibold tracking-wide py-2 transition-all duration-300 ${
              activeTab === "cars"
                ? "text-orange-600"
                : "text-gray-400 hover:text-orange-600"
            }`}
            onClick={() => setActiveTab("cars")}
          >
            Cars
            <span
              className={`absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 transition-all duration-300 ${
                activeTab === "cars" ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>

          <button
            className={`relative bg-transparent text-xl sm:text-2xl md:text-3xl font-semibold tracking-wide py-2 transition-all duration-300 ${
              activeTab === "bikes"
                ? "text-orange-600"
                : "text-gray-400 hover:text-orange-600"
            }`}
            onClick={() => setActiveTab("bikes")}
          >
            Bikes
            <span
              className={`absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 transition-all duration-300 ${
                activeTab === "bikes" ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>
        </div>

        {/* Services Grid - Centered */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5 md:gap-6">
          {currentServices.map((service, index) => (
            <ServiceCard
              key={`${activeTab}-${index}`}
              icon={service.icon}
              title={service.name}
              link="/services"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
