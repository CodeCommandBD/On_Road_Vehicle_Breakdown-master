"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { motion } from "framer-motion";

export default function AboutHero() {
  const t = useTranslations("About");

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-gray-900 via-[#1A1A1A] to-gray-900 pt-24 pb-16 sm:pt-32 sm:pb-24">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-sm font-medium text-orange-400">
                {t("badge")}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              <span className="gradient-text">{t("title")}</span>
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-300 leading-relaxed max-w-xl">
              {t("description")}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6 pt-4">
              <div className="space-y-1">
                <div className="text-3xl font-bold gradient-text">5K+</div>
                <div className="text-sm text-gray-400">{t("customers")}</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold gradient-text">500+</div>
                <div className="text-sm text-gray-400">{t("garages")}</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold gradient-text">24/7</div>
                <div className="text-sm text-gray-400">{t("support")}</div>
              </div>
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden glass-card">
              <Image
                src="/Hero-img/hero-slide-one.png"
                alt="About Us"
                fill
                className="object-cover"
                priority
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Floating Card */}
              <div className="absolute bottom-6 left-6 right-6 glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-orange border-2 border-white/20" />
                    <div className="w-10 h-10 rounded-full bg-gradient-blue border-2 border-white/20" />
                    <div className="w-10 h-10 rounded-full bg-gradient-green border-2 border-white/20" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {t("trustedBy")}
                    </div>
                    <div className="text-xs text-gray-300">
                      {t("happyCustomers")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-orange rounded-full blur-2xl opacity-50" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-blue rounded-full blur-2xl opacity-50" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
