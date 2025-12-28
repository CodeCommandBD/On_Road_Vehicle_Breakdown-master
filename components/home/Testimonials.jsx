"use client";

import { Star, Quote } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useTranslations } from "next-intl";

const testimonials = [
  {
    id: 1,
    name: "Rahim Ahmed",
    role: "Car Owner",
    image: "/images/user-1.jpg",
    content:
      "My car broke down in the middle of the night. QuickService connected me with a nearby garage within minutes. Highly recommended!",
    rating: 5,
  },
  {
    id: 2,
    name: "Fatima Khan",
    role: "Regular User",
    image: "/images/user-2.jpg",
    content:
      "Excellent service! The app is very easy to use, and the garage they suggested provided professional service at a reasonable price.",
    rating: 5,
  },
  {
    id: 3,
    name: "Karim Uddin",
    role: "Truck Driver",
    image: "/images/user-3.jpg",
    content:
      "As a truck driver, breakdowns are a nightmare. This service is a lifesaver. Fast response and reliable mechanics.",
    rating: 4,
  },
  {
    id: 4,
    name: "Nusrat Jahan",
    role: "Car Owner",
    image: "/images/user-4.jpg",
    content:
      "The membership package is worth every penny. I saved a lot on regular maintenance and got priority support during an emergency.",
    rating: 5,
  },
];

export default function Testimonials() {
  const t = useTranslations("Home.testimonials");
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header - Centered */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-block text-orange-600 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-3">
            Testimonials
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
            {t("title")}{" "}
            <span className="text-orange-600">{t("highlight")}</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
            Don&apos;t just take our word for it. Read what our satisfied
            customers have to say about their experience with QuickService.
          </p>
        </div>

        {/* Slider - Centered */}
        <div className="max-w-5xl mx-auto">
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            pagination={{
              clickable: true,
              bulletClass: "swiper-pagination-bullet !bg-orange-600",
              bulletActiveClass:
                "swiper-pagination-bullet-active !bg-orange-600",
            }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 2,
                spaceBetween: 30,
              },
            }}
            className="pb-14 sm:pb-16 [&_.swiper-pagination-bullet]:opacity-50 [&_.swiper-pagination-bullet]:transition-all [&_.swiper-pagination-bullet]:duration-300 [&_.swiper-pagination-bullet-active]:!opacity-100 [&_.swiper-pagination-bullet-active]:scale-[1.2]"
          >
            {testimonials.map((item) => (
              <SwiperSlide key={item.id} className="h-auto">
                <div className="group h-full flex flex-col items-center text-center relative bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-orange-200 mt-8">
                  {/* Quote Icon */}
                  <div className="absolute -top-6 w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                    <Quote className="w-5 h-5 fill-white" />
                  </div>

                  {/* Content */}
                  <p className="text-sm sm:text-base text-gray-700 italic mb-6 mt-4 leading-relaxed">
                    &quot;{item.content}&quot;
                  </p>

                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 transition-transform duration-300 ${
                          i < item.rating
                            ? "text-yellow-500 fill-yellow-500 group-hover:scale-110"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  {/* User Info */}
                  <div className="mt-auto">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full mx-auto mb-3 overflow-hidden border-2 border-orange-300 transition-transform duration-300 group-hover:scale-110">
                      {/* Placeholder for image if not found */}
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-500 text-white text-xl font-bold">
                        {item.name[0]}
                      </div>
                    </div>
                    <h4 className="font-semibold text-base sm:text-lg text-gray-900">
                      {item.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {item.role}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
