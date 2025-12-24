"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const t = useTranslations("Common");

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default browser prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the native install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the PWA install");
    } else {
      console.log("User dismissed the PWA install");
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[9999] animate-in slide-in-from-bottom duration-500">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        {/* Decorative Background */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl group-hover:bg-orange-500/30 transition-all"></div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 shrink-0">
            <Smartphone className="text-white" size={28} />
          </div>

          <div className="flex-1">
            <h3 className="text-white font-bold text-lg leading-tight">
              Install On-Road Help
            </h3>
            <p className="text-white/60 text-xs mt-1">
              Get instant mechanic support directly from your home screen.
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 flex gap-3 relative z-10">
          <button
            onClick={handleInstallClick}
            className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all text-sm uppercase tracking-wider"
          >
            <Download size={18} />
            Install App
          </button>

          <button
            onClick={handleDismiss}
            className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white/80 rounded-2xl font-medium transition-all text-sm"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
