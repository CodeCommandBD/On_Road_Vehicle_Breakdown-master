"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function SettingsModal({ isOpen, onClose }) {
  const t = useTranslations();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1002] w-[90%] max-w-[450px]">
        <div className="bg-[#141414fa] bg-gradient-to-br from-[#141414fa] to-[#1e1e1ef2] backdrop-blur-[20px] border border-[#ff48004d] rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,72,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-visible">
          {/* Header */}
          <div className="relative p-[20px] bg-gradient-to-br from-[#ff48001a] to-[#ff48000d] border-b border-[#ff480033] rounded-t-[20px]">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff480080] to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff480080] to-transparent"></div>

            <div className="flex items-center justify-between">
              <h2 className="text-white text-[20px] font-bold tracking-[0.3px]">
                {t("Navigation.settings")}
              </h2>
              <button
                onClick={onClose}
                className="w-[32px] h-[32px] flex items-center justify-center rounded-[8px] bg-[#ff48001a] text-white/60 hover:bg-[#ff480033] hover:text-white transition-all duration-300 hover:rotate-90"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-[24px] rounded-b-[20px] bg-[#141414fa]">
            {/* Language Section */}
            <div className="space-y-[12px]">
              <div className="flex items-center justify-between mb-[16px]">
                <div>
                  <h3 className="text-white text-[15px] font-semibold mb-[4px]">
                    {t("Settings.language")}
                  </h3>
                  <p className="text-[#ffffff99] text-[12px]">
                    Choose your preferred language
                  </p>
                </div>
              </div>

              {/* Language Switcher */}
              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
