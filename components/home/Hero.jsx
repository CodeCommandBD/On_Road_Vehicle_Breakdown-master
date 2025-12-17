"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const heroSlides = [
  {
    image: "/Hero-img/hero-slide-one.png",
    title: "On-Road Breakdown Service",
    subtitle: "24/7 Emergency Vehicle Assistance",
    description:
      "Get instant help whenever your vehicle breaks down. Our expert mechanics are always ready to assist you.",
  },
  {
    image: "/Hero-img/hero-slide-two.png",
    title: "Professional Auto Repair",
    subtitle: "Trusted Garage Network",
    description:
      "Connect with certified garages and mechanics in your area for quality vehicle maintenance and repairs.",
  },
];

export default function Hero() {
  const swiperRef = useRef(null);

  return (
    <section id="hero" className="relative isolate overflow-hidden bg-gray-900">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          prevEl: ".hero-prev",
          nextEl: ".hero-next",
        }}
        pagination={{
          el: ".hero-pagination",
          clickable: true,
          renderBullet: (index, className) => {
            return `<span class="${className} !w-3 !h-3 !bg-white/50 !rounded-full transition-all duration-300 hover:!bg-white"></span>`;
          },
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        speed={1000}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        className="h-[80vh] md:h-[90vh] [&_.swiper-pagination-bullet]:opacity-70 [&_.swiper-pagination-bullet-active]:!bg-white [&_.swiper-pagination-bullet-active]:!opacity-100 [&_.swiper-pagination-bullet-active]:scale-[1.2]"
      >
        {heroSlides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="relative h-full w-full">
              {/* Background Image */}
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={index === 0}
                className="object-cover -z-10"
              />
              {/* Dark Overlay */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />

              {/* Content Container - Centered */}
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex h-full items-center">
                  <div className="max-w-2xl text-white space-y-4 sm:space-y-6 animate-[fadeInUp_0.8s_ease-out_forwards]">
                    {/* Title with animation */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight transform transition-all duration-700 ease-out">
                      {slide.title}
                    </h1>

                    {/* Description */}
                    <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-200 max-w-xl">
                      {slide.description}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 sm:pt-4">
                      <Link
                        href="/book"
                        className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base text-white font-semibold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:from-orange-700 hover:to-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                      >
                        Get Started
                      </Link>

                      <Link
                        href="#services"
                        className="inline-flex items-center justify-center rounded-lg border-2 border-white/30 bg-white/10 backdrop-blur-sm px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base text-white font-semibold transition-all duration-300 hover:bg-white/20 hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                      >
                        Learn More
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Controls - Centered Container */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 sm:bottom-8 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <button
              className="hero-prev pointer-events-auto group inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white text-xl sm:text-2xl font-bold border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              aria-label="Previous Slide"
            >
              <span className="transform transition-transform duration-300 group-hover:-translate-x-0.5">
                ‹
              </span>
            </button>

            {/* Pagination Dots */}
            <div className="hero-pagination flex items-center gap-2" />

            {/* Next Button */}
            <button
              className="hero-next pointer-events-auto group inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white text-xl sm:text-2xl font-bold border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              aria-label="Next Slide"
            >
              <span className="transform transition-transform duration-300 group-hover:translate-x-0.5">
                ›
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
