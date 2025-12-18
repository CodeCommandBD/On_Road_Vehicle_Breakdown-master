"use client";

import { Plus, AlertCircle, MapPin, MessageCircle, Siren } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

export default function QuickActions() {
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const handleSOS = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    if (!user) {
      toast.error("Please login to use Emergency SOS");
      return;
    }

    const confirmSOS = window.confirm(
      "Are you sure you want to trigger an Emergency SOS? This will alert nearby garages and admins."
    );
    if (!confirmSOS) return;

    try {
      setLoading(true);
      toast.info("Capturing your location...");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const response = await axios.post("/api/sos", {
              latitude,
              longitude,
              phone: user.phone || "01XXXXXXXXX", // Fallback if phone not in state
              vehicleType: user.vehicles?.[0]?.vehicleType || "Other",
              address: "Automatic Location Capture",
            });

            if (response.data.success) {
              toast.success("EMERGENCY ALERT SENT! Help is on the way.");
              // Trigger a siren sound or other visual feedback if possible
            }
          } catch (error) {
            console.error("SOS API error:", error);
            toast.error(
              "Failed to send SOS alert. Please call emergency services."
            );
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error(
            "Could not capture location. Please ensure GPS is enabled."
          );
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("SOS handle error:", error);
      setLoading(false);
    }
  };

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
      description: loading ? "Sending Alert..." : "Urgent assistance",
      icon: loading ? Siren : AlertCircle,
      gradient: "gradient-red",
      href: "#sos",
      shadow: "shadow-glow-red",
      pulse: true,
      onClick: handleSOS,
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
            ? {
                onClick:
                  action.onClick ||
                  (() => console.log(`${action.title} clicked`)),
              }
            : { href: action.href };

          return (
            <ActionWrapper
              key={index}
              {...wrapperProps}
              disabled={loading && action.pulse}
              className={`${action.gradient} ${
                action.shadow
              } rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white transition-all scale-hover group ${
                action.pulse ? (loading ? "animate-pulse" : "pulse-glow") : ""
              } flex flex-col items-start w-full text-left`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-white/30 transition-all">
                <action.icon
                  className={`${
                    loading && action.pulse ? "animate-spin" : ""
                  } w-5 h-5 sm:w-6 sm:h-6`}
                />
              </div>
              <h4 className="font-bold text-sm sm:text-lg mb-0.5 sm:mb-1">
                {action.title}
              </h4>
              <p className="text-xs sm:text-sm text-white/80 line-clamp-1">
                {action.description}
              </p>
            </ActionWrapper>
          );
        })}
      </div>
    </div>
  );
}
