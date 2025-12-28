"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Award,
  HeadphonesIcon,
  MapPin,
  DollarSign,
} from "lucide-react";

export default function WhyChooseUs() {
  const t = useTranslations("About");

  const features = [
    {
      icon: Shield,
      title: t("feature1Title"),
      description: t("feature1Desc"),
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Zap,
      title: t("feature2Title"),
      description: t("feature2Desc"),
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Award,
      title: t("feature3Title"),
      description: t("feature3Desc"),
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: HeadphonesIcon,
      title: t("feature4Title"),
      description: t("feature4Desc"),
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: MapPin,
      title: t("feature5Title"),
      description: t("feature5Desc"),
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
    },
    {
      icon: DollarSign,
      title: t("feature6Title"),
      description: t("feature6Desc"),
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 bg-[#1A1A1A] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:3rem_3rem]" />

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
            {t("whyChooseUs")}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t("whyChooseUsDesc")}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <div className="glass-card p-6 rounded-xl h-full transition-all duration-300 hover:border-white/20">
                  {/* Icon */}
                  <div
                    className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4 transform transition-all duration-300 group-hover:scale-110`}
                  >
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-orange-400 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
