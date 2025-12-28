"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Image from "next/image";
import { Linkedin, Twitter, Mail } from "lucide-react";

export default function TeamShowcase() {
  const t = useTranslations("About");

  const team = [
    {
      name: t("team1Name"),
      role: t("team1Role"),
      image: "https://i.pravatar.cc/400?img=12",
      bio: t("team1Bio"),
    },
    {
      name: t("team2Name"),
      role: t("team2Role"),
      image: "https://i.pravatar.cc/400?img=13",
      bio: t("team2Bio"),
    },
    {
      name: t("team3Name"),
      role: t("team3Role"),
      image: "https://i.pravatar.cc/400?img=14",
      bio: t("team3Bio"),
    },
    {
      name: t("team4Name"),
      role: t("team4Role"),
      image: "https://i.pravatar.cc/400?img=15",
      bio: t("team4Bio"),
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 bg-gradient-to-b from-[#1A1A1A] to-[#111]">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
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
            {t("teamTitle")}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t("teamDesc")}
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-glow-orange">
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-orange-500/20 to-blue-500/20">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-sm text-gray-300 mb-3">{member.bio}</p>
                      {/* Social Links */}
                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
                          <Linkedin className="w-4 h-4 text-white" />
                        </button>
                        <button className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
                          <Twitter className="w-4 h-4 text-white" />
                        </button>
                        <button className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
                          <Mail className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-sm text-gray-400">{member.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
