"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import { setUnreadNotificationsCount } from "@/store/slices/uiSlice";
import axiosInstance from "@/lib/axios";

export default function NotificationListener() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user?._id || !pusherClient) return;

    // Subscribe to user-specific channel
    const channel = pusherClient.subscribe(`user-${user._id}`);

    // Listen for generic notifications
    channel.bind("notification", async (data) => {
      toast.info(data.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Update unread count dynamically
      try {
        const res = await axiosInstance.get("/notifications");
        if (res.data.success) {
          dispatch(setUnreadNotificationsCount(res.data.unreadCount));
        }
      } catch (err) {
        console.error("Failed to sync notifications on event:", err);
      }
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
