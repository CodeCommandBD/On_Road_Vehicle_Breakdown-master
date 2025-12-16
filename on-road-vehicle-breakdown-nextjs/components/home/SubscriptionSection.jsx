"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Settings } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SubscriptionSection() {
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Refs for GSAP animations
  const sectionRef = useRef(null);
  const leftContentRef = useRef(null);
  const rightContentRef = useRef(null);

  useEffect(() => {
    fetchPremiumPackage();
  }, []);

  // GSAP ScrollTrigger animations
  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      // Left content slides from left - smooth and immediate
      gsap.from(leftContentRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 90%", // Starts as soon as section appears
          toggleActions: "play none none reverse",
        },
        x: -120,
        duration: 1.2,
        ease: "power2.out", // Smoother easing
      });

      // Right content (car) slides from right - smooth and immediate
      gsap.from(rightContentRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 90%", // Starts as soon as section appears
          toggleActions: "play none none reverse",
        },
        x: 120,
        duration: 1.2,
        ease: "power2.out", // Smoother easing
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [loading]);

  const fetchPremiumPackage = async () => {
    try {
      const response = await fetch("/api/packages?tier=premium");
      const data = await response.json();
      if (data.success && data.data.packages?.length > 0) {
        setPackageData(data.data.packages[0]);
      } else {
        // Fallback data if no package found
        setPackageData({
          name: "Premium Membership",
          discount: 34,
          price: { monthly: 499 },
          benefits: [
            "Latest technology",
            "24/7 service & quick car",
            "Always repairable vehicles",
            "Emergency priority support",
            "Technician 24/7 day & car",
          ],
        });
      }
    } catch (error) {
      console.error("Failed to fetch package:", error);
      // Use fallback data
      setPackageData({
        name: "Premium Membership",
        discount: 34,
        price: { monthly: 499 },
        benefits: [
          "Latest technology",
          "24/7 service & quick car",
          "Always repairable vehicles",
          "Emergency priority support",
          "Technician 24/7 day & car",
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-[#111] py-[100px]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="h-[400px] rounded-[12px] bg-[linear-gradient(90deg,#1e1e1e_25%,#2a2a2a_50%,#1e1e1e_75%)] bg-[length:200%_100%] animate-[loading_1.5s_infinite]"></div>
            <div className="h-[400px] rounded-[12px] bg-[linear-gradient(90deg,#1e1e1e_25%,#2a2a2a_50%,#1e1e1e_75%)] bg-[length:200%_100%] animate-[loading_1.5s_infinite]"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden bg-[#111] py-[100px]" ref={sectionRef}>
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03] pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_35px,rgba(255,255,255,0.1)_35px,rgba(255,255,255,0.1)_70px),repeating-linear-gradient(-45deg,transparent,transparent_35px,rgba(255,255,255,0.1)_35px,rgba(255,255,255,0.1)_70px)]"></div>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 relative z-[1]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
              {/* Left Content */}
              <div className="flex flex-col items-center lg:items-start" ref={leftContentRef}>
                <div className="flex gap-2.5 mb-5 items-center">
                  <Settings className="w-4 h-4 text-[#FF6644] animate-[scaleAnimation_3s_ease-in-out_infinite]" />
                  <div>
                    <h5 className="text-[#F23C13] text-xs font-normal tracking-[0.7px] uppercase m-0">TESTIMONIAL</h5>
                  </div>
                </div>
                
                <div className="mb-10 text-center lg:text-left">
                  <h1 className="text-white text-[32px] lg:text-[45px] font-bold tracking-[0.5px] leading-[1.2]">
                    {packageData?.name || "Great Subscription \n for Repair Service"}
                  </h1>
                </div>

                <div className="mb-10 w-full text-center lg:text-left">
                  <h3 className="text-white text-xl lg:text-[26px] font-bold tracking-[1.2px] mb-4">
                    PREMIUM BEST
                  </h3>
                  <h2 className="text-[#F23C13] text-[40px] font-bold tracking-[2px]">
                    {/* Handle price being an object or number safely */}
                    ${typeof packageData?.price === 'object' ? packageData.price.monthly : (packageData?.price || 400)}
                    <span className="text-white text-[25px] font-medium tracking-[1.4px]">/Monthly</span>
                  </h2>
                </div>

                <div className="flex flex-col gap-5 mb-10 w-full">
                  {(packageData?.benefits || packageData?.features?.map((f) => f.name) || [
                    "Latest technology",
                    "24/7 service & quick car",
                    "Always repairable vehicles",
                    "Emergency priority support",
                    "Technician 24/7 day & car",
                  ]).map((benefit, index) => (
                    <div key={index} className="flex items-center gap-5">
                      <div className="flex flex-col items-end gap-1.5 mr-5">
                        <div className="w-[26px] h-[2px] bg-[#00F50C] animate-[linePulse1_2s_linear_infinite]"></div>
                        <div className="w-[15px] h-[2px] bg-[#00FF95] animate-[linePulse2_2.5s_linear_infinite]"></div>
                      </div>
                      <div>
                        <h4 className="text-white text-lg font-medium tracking-[0.8px] m-0">{benefit}</h4>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <Link href="/dashboard/bookings" className="relative inline-block text-white text-shadow-[0_6px_12px_rgba(201,203,208,0.25)] text-xl font-semibold leading-[160%] rounded-md bg-[#F23C13] shadow-[0_5px_20px_0_rgba(0,0,0,0.05)] px-6 py-3 overflow-hidden transition-all duration-600 z-[2] border-none cursor-pointer hover:text-black hover:-translate-y-[3px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] group">
                    {/* Glow Effect Pseudo-elements */}
                    <span className="absolute top-[-2em] left-[-2em] w-[50px] h-[50px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white -z-10 transition-all duration-1000 group-hover:w-[410px] group-hover:h-[410px]"></span>
                    <span className="absolute top-[calc(100%+2em)] left-[calc(100%+2em)] w-[50px] h-[50px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white -z-10 transition-all duration-1000 group-hover:w-[410px] group-hover:h-[410px]"></span>
                    
                    {/* Animated Boarder Lines using Tailwind Arbitrary values */}
                    <span className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#2a048b00] to-white animate-[borderRotate1_2s_linear_infinite]"></span>
                    <span className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-[#4800ff00] to-white animate-[borderRotate2_2s_linear_infinite]"></span>
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-l from-[#4800ff00] to-white animate-[borderRotate3_2s_linear_infinite]"></span>
                    <span className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-t from-[#4800ff00] to-white animate-[borderRotate4_2s_linear_infinite]"></span>
                    
                    GET MEMBERSHIP
                  </Link>
                </div>
              </div>

              {/* Right Content - Mustang Car */}
              <div className="relative w-full flex justify-center lg:justify-end" ref={rightContentRef}>
                 <div className="relative w-full max-w-[500px] h-[300px] lg:h-[450px] flex items-center justify-center">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(255,83,45,0.3)_0%,rgba(255,83,45,0.1)_40%,transparent_70%)] animate-[pulse_3s_ease-in-out_infinite]"></div>
                   <Image
                     src="/images/nav/mustang_car.png"
                     alt="Premium Car"
                     fill
                     className="relative z-[2] object-contain drop-shadow-[0_20px_40px_rgba(255,83,45,0.4)] animate-[float_6s_ease-in-out_infinite]"
                     priority
                   />
                 </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
}
