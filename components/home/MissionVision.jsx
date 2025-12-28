"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Target, Eye, Heart } from "lucide-react";

export default function MissionVision() {
  const t = useTranslations("About");

  const cards = [
    {
      icon: Target,
      title: t("missionTitle"),
      description: t("missionDesc"),
      gradient: "gradient-orange",
    },
    {
      icon: Eye,
      title: t("visionTitle"),
      description: t("visionDesc"),
      gradient: "gradient-blue",
    },
    {
      icon: Heart,
      title: t("valuesTitle"),
      description: t("valuesDesc"),
      gradient: "gradient-purple",
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 bg-[#111] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,72,0,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(33,150,243,0.05),transparent_50%)]" />

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
            {t("ourStory")}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t("storyDesc")}
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative"
              >
                <div className="glass-card p-8 rounded-2xl h-full transition-all duration-300 hover:shadow-glow-orange">
                  {/* Icon */}
                  <div
                    className={`inline-flex p-4 rounded-xl ${card.gradient} mb-6 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold mb-4 text-white">
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-300 leading-relaxed">
                    {card.description}
                  </p>

                  {/* Decorative Line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
