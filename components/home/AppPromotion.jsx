"use client";

import Image from "next/image";
import { Download, Smartphone, QrCode, CheckCircle2, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function AppPromotion() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Generate QR code for the current URL
    const currentUrl = window.location.origin;
    setQrUrl(
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        currentUrl
      )}&color=e85d04`
    );

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
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
    if (!deferredPrompt) {
      setShowModal(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const features = [
    "Real-time Tracking",
    "SOS Emergency Alerts",
    "Service History",
    "Direct Messaging",
  ];

  return (
    <section className="py-24 bg-[#111] overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-white/10 rounded-[40px] p-8 md:p-16 relative">
          {/* Background Decorative Circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px] -z-10"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px] -z-10"></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content Side */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-sm font-semibold uppercase tracking-wider">
                <Smartphone size={16} />
                Now Available on Mobile
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                  Take <span className="text-orange-500">On Road Help</span>{" "}
                  <br />
                  Wherever You Go
                </h2>
                <p className="text-white/60 text-lg max-w-lg">
                  Install our lightweight app (PWA) to get instant assistance,
                  track mechanics in real-time, and manage your vehicle health
                  even offline.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-white/80"
                  >
                    <CheckCircle2 className="text-orange-500" size={20} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8 pt-4">
                <button
                  onClick={handleInstallClick}
                  className="w-full sm:w-auto px-10 py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_10px_30px_rgba(232,93,4,0.3)]"
                >
                  <Download size={24} />
                  INSTALL APP
                </button>
              </div>
            </div>

            {/* Mockup Side */}
            <div className="relative group perspective-1000 flex flex-col md:flex-row items-center gap-8">
              <div className="relative z-10 animate-float translate-z-20 flex-1">
                <Image
                  src="/images/app-mockup.png"
                  alt="On Road Help Mobile App"
                  width={600}
                  height={800}
                  className="w-full max-w-[450px] mx-auto drop-shadow-[0_50px_100px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* QR Code Next to Mobile */}
              <div className="hidden md:flex flex-col items-center gap-4 shrink-0 animate-in fade-in slide-in-from-right duration-1000">
                <div className="p-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[40px] shadow-2xl">
                  <div className="w-44 h-44 bg-white p-4 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
                    {qrUrl ? (
                      <Image
                        src={qrUrl}
                        alt="Scan to install"
                        width={176}
                        height={176}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 animate-pulse rounded-xl"></div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-lg">
                    Scan to Install
                  </p>
                  <p className="text-orange-500 text-xs mt-1 uppercase tracking-widest font-black">
                    Instant Access
                  </p>
                </div>
              </div>

              {/* Stats Card Overlay */}
              <div className="absolute bottom-16 left-1/2 md:left-4 -translate-x-1/2 md:-translate-x-0 bg-white/10 backdrop-blur-2xl border border-white/20 p-6 rounded-[32px] shadow-2xl animate-pulse-slow z-20 min-w-[200px]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center border border-green-500/20">
                    <CheckCircle2 className="text-green-500" size={24} />
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                      Network Status
                    </p>
                    <p className="text-white font-black text-base italic">
                      24/7 ACTIVE
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Installation Guide Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>

          <div className="bg-[#1a1a1a] border border-white/10 rounded-[40px] p-8 md:p-12 w-full max-w-2xl relative z-10 animate-in zoom-in-95 duration-300 shadow-[0_0_100px_rgba(232,93,4,0.1)]">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-3 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
            >
              <X size={24} />
            </button>

            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-orange-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Download className="text-white" size={40} />
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase tracking-tight">
                  How to Install
                </h3>
                <p className="text-white/60">
                  Follow these simple steps to get the app on your home screen.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 font-bold">
                    1
                  </div>
                  <h4 className="text-white font-bold text-sm">Open Menu</h4>
                  <p className="text-white/40 text-xs">
                    Click the three dots or share icon in your browser.
                  </p>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 font-bold">
                    2
                  </div>
                  <h4 className="text-white font-bold text-sm">Find Install</h4>
                  <p className="text-white/40 text-xs">
                    Look for "Install App" or "Add to Home Screen".
                  </p>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 font-bold">
                    3
                  </div>
                  <h4 className="text-white font-bold text-sm">Confirm</h4>
                  <p className="text-white/40 text-xs">
                    Click "Install" to complete the setup.
                  </p>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold transition-all"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
