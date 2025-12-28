"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Users, MapPin, Wrench, Clock } from "lucide-react";

function CountUp({ end, duration = 2000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
}

export default function Statistics() {
  const t = useTranslations("About");
  const [isVisible, setIsVisible] = useState(false);

  const stats = [
    {
      icon: Users,
      value: 5000,
      suffix: "+",
      label: t("statCustomers"),
      gradient: "gradient-orange",
    },
    {
      icon: MapPin,
      value: 500,
      suffix: "+",
      label: t("statGarages"),
      gradient: "gradient-blue",
    },
    {
      icon: Wrench,
      value: 15000,
      suffix: "+",
      label: t("statServices"),
      gradient: "gradient-green",
    },
    {
      icon: Clock,
      value: 24,
      suffix: "/7",
      label: t("statSupport"),
      gradient: "gradient-purple",
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 bg-gradient-to-b from-[#111] to-[#1A1A1A]">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-1/2 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {t("statsTitle")}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t("statsDesc")}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          onViewportEnter={() => setIsVisible(true)}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="group relative"
              >
                <div className="glass-card p-8 rounded-2xl text-center h-full transition-all duration-300 hover:shadow-glow-orange">
                  {/* Icon */}
                  <div
                    className={`inline-flex p-4 rounded-xl ${stat.gradient} mb-4 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Value */}
                  <div className="text-4xl sm:text-5xl font-bold gradient-text mb-2">
                    {isVisible ? <CountUp end={stat.value} /> : "0"}
                    {stat.suffix}
                  </div>

                  {/* Label */}
                  <div className="text-gray-400 font-medium">{stat.label}</div>

                  {/* Pulse Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
