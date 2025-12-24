"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";

export default function NotificationListener() {
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user?._id) return;

    // Subscribe to user-specific channel
    const channel = pusherClient.subscribe(`user-${user._id}`);

    // Listen for generic notifications
    channel.bind("notification", (data) => {
      toast.info(data.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      // You can also dispatch an action here to update Redux state if needed
    });

    // Listen for SOS alerts (if user is a garage)
    if (user.role === "garage") {
      const sosChannel = pusherClient.subscribe("sos-alerts");
      sosChannel.bind("new-sos", (data) => {
        toast.error(`🚨 NEW SOS ALERT: ${data.location}`, {
          autoClose: 10000,
          position: "top-center",
        });
        // Play alert sound
        const audio = new Audio("/sounds/alert.mp3");
        audio.play().catch((e) => console.log("Audio play failed", e));
      });
    }

    return () => {
      pusherClient.unsubscribe(`user-${user._id}`);
      if (user.role === "garage") {
        pusherClient.unsubscribe("sos-alerts");
      }
    };
  }, [user]);

  return null;
}
