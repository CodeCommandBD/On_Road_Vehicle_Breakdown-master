"use client";

import { useTranslations } from "next-intl";
import { Shield, Award, Users } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

export default function TrustedBy() {
  const t = useTranslations("Home");
  const [branding, setBranding] = useState({
    sectionTitle: "Trusted by top automotive partners",
    items: [],
  });
  const [loading, setLoading] = useState(true);

  // Default partners as fallback
  const defaultPartners = [
    { name: "AutoFix", icon: "wrench" },
    { name: "City Towing", icon: "users" },
    { name: "Premium Parts", icon: "tag" },
    { name: "Verified Mech", icon: "award" },
    { name: "Secure Drive", icon: "shield" },
  ];

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const res = await axios.get("/api/admin/branding");
      if (res.data.success && res.data.data.items.length > 0) {
        setBranding(res.data.data);
      } else {
        // Use default if no data
        setBranding({
          sectionTitle: "Trusted by top automotive partners",
          items: defaultPartners,
        });
      }
    } catch (error) {
      console.error("Failed to load branding:", error);
      // Fallback to default
      setBranding({
        sectionTitle: "Trusted by top automotive partners",
        items: defaultPartners,
      });
    } finally {
      setLoading(false);
    }
  };

  // Icon mapping
  const getIcon = (iconName) => {
    const icons = {
      wrench: Wrench,
      users: Users,
      tag: Tag,
      award: Award,
      shield: Shield,
      car: Car,
      tool: Tool,
      star: Star,
    };
    return icons[iconName] || Wrench;
  };

  // Custom icon components
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

  function Tag(props) {
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
        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
        <path d="M7 7h.01" />
      </svg>
    );
  }

  function Car(props) {
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
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    );
  }

  function Tool(props) {
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

  function Star(props) {
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
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }

  if (loading) {
    return (
      <section className="py-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">
            {branding.sectionTitle}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap justify-center items-center gap-x-8 gap-y-12 lg:gap-16">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-white/10 rounded" />
                <div className="h-6 bg-white/10 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 border-b border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/5" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">
          {branding.sectionTitle}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap justify-center items-center gap-x-8 gap-y-12 lg:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          {branding.items.map((partner, index) => {
            const IconComponent = getIcon(partner.icon);
            return (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 group cursor-pointer animate-fadeIn"
                style={{
                  animationDelay: `${index * 80}ms`,
                  animationFillMode: "both",
                }}
              >
                {partner.logoUrl ? (
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 group-hover:text-orange-500 transition-colors duration-300" />
                )}
                <span className="text-base sm:text-xl font-bold text-gray-400 group-hover:text-white transition-colors duration-300">
                  {partner.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
