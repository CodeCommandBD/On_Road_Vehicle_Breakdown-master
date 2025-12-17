"use client";

import { Plus, AlertCircle, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  const actions = [
    {
      title: "New Request",
      description: "Book a service",
      icon: Plus,
      gradient: "gradient-orange",
      href: "/book",
      shadow: "shadow-glow-orange",
    },
    {
      title: "Emergency SOS",
      description: "Urgent assistance",
      icon: AlertCircle,
      gradient: "gradient-red",
      href: "#",
      shadow: "shadow-glow-red",
      pulse: true,
    },
    {
      title: "Find Garages",
      description: "Nearby locations",
      icon: MapPin,
      gradient: "gradient-blue",
      href: "#garages",
      shadow: "shadow-glow-blue",
    },
    {
      title: "Support",
      description: "Get help",
      icon: MessageCircle,
      gradient: "gradient-green",
      href: "#support",
      shadow: "shadow-glow-green",
    },
  ];

  return (
    <div className="mb-6 sm:mb-8 fade-in">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {actions.map((action, index) => {
          const ActionWrapper = action.href.startsWith("#") ? "button" : Link;
          const wrapperProps = action.href.startsWith("#")
            ? { onClick: () => console.log(`${action.title} clicked`) }
            : { href: action.href };

          return (
            <ActionWrapper
              key={index}
              {...wrapperProps}
              className={`${action.gradient} ${
                action.shadow
              } rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white transition-all scale-hover group ${
                action.pulse ? "pulse-glow" : ""
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col items-start">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-white/30 transition-all">
                  <action.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="font-bold text-sm sm:text-lg mb-0.5 sm:mb-1">
                  {action.title}
                </h4>
                <p className="text-xs sm:text-sm text-white/80">
                  {action.description}
                </p>
              </div>
            </ActionWrapper>
          );
        })}
      </div>
    </div>
  );
}
