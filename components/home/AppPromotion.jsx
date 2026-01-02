"use client";

import Image from "next/image";
import { Download, Smartphone, QrCode, CheckCircle2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function AppPromotion() {
  const t = useTranslations("Home.appPromotion");
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
    <section className="py-20 lg:py-32 bg-[#0B0B0F] overflow-hidden relative">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[140px] -z-10"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] lg:rounded-[60px] p-8 md:p-16 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Content Side */}
            <div className="lg:col-span-7 space-y-8 lg:pr-12 order-2 lg:order-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500/20 to-orange-500/5 border border-orange-500/20 rounded-full text-orange-400 text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(232,93,4,0.2)] mx-auto lg:mx-0">
                <Smartphone size={18} className="animate-bounce-slight" />
                <span>Now Available on Mobile</span>
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
                  {t("title")}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
                    {t("highlight")}
                  </span>{" "}
                  <br className="hidden lg:block" />
                  {t("subtitle")}
                </h2>
                <p className="text-gray-400 text-lg lg:text-xl max-w-xl leading-relaxed mx-auto lg:mx-0">
                  {t("description")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center lg:justify-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors duration-300"
                  >
                    <div className="p-2 rounded-full bg-orange-500/20 text-orange-400">
                      <CheckCircle2 size={20} />
                    </div>
                    <span className="text-gray-200 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-6">
                <button
                  onClick={handleInstallClick}
                  className="group relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 shadow-[0_20px_40px_rgba(232,93,4,0.3)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  <Download size={24} />
                  <span>{t("downloadApp")}</span>
                </button>

                <span className="text-gray-500 font-medium hidden sm:block">
                  or scan code
                </span>
              </div>
            </div>

            {/* Mockup & QR Side */}
            <div className="lg:col-span-5 relative order-1 lg:order-2 w-full flex flex-col items-center justify-center lg:justify-end gap-8 pt-8 lg:pt-0">
              <div className="relative z-10 w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[400px]">
                {/* Floating Glow Behind */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-500/20 rounded-full blur-[80px] -z-10 animate-pulse"></div>

                <Image
                  src="/images/app-mockup.webp"
                  alt="On Road Help Mobile App"
                  width={600}
                  height={800}
                  className="w-full h-auto drop-shadow-2xl animate-float"
                  style={{ animationDuration: "6s" }}
                />

                {/* Floating Glass Card for QR (Desktop Only) */}
                <div
                  className="hidden lg:flex absolute -bottom-10 -left-20 p-5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-float-delayed flex-col items-center gap-4 max-w-[200px]"
                  style={{ animationDuration: "8s" }}
                >
                  <div className="bg-white p-3 rounded-2xl shadow-inner w-full aspect-square flex items-center justify-center">
                    {qrUrl ? (
                      <Image
                        src={qrUrl}
                        alt="Scan to install"
                        width={150}
                        height={150}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 animate-pulse rounded-xl"></div>
                    )}
                  </div>
                  <div className="text-center w-full">
                    <p className="text-white text-sm font-bold leading-tight mb-1">
                      Scan to Install
                    </p>
                    <p className="text-orange-400 text-[10px] uppercase tracking-widest font-bold">
                      iOS & Android
                    </p>
                  </div>
                </div>

                {/* Desktop Overlay Stats Card */}
                <div className="hidden lg:block absolute bottom-20 -right-12 bg-white/10 backdrop-blur-2xl border border-white/20 p-6 rounded-[32px] shadow-2xl animate-pulse-slow z-20 min-w-[200px]">
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

              {/* Mobile Stats Card (Below Phone) */}
              <div className="lg:hidden w-full max-w-[280px] bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-[24px] flex items-center gap-4 mx-auto">
                <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center border border-green-500/20 shrink-0">
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
