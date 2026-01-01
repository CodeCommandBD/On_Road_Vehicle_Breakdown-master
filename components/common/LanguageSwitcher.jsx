"use client";

import { useLocale } from "next-intl";
import { Globe, Check } from "lucide-react";
import { useState } from "react";
import { setStoredLocale } from "@/lib/i18n/localeStorage";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "bn", name: "বাংলা", flag: "🇧🇩" },
  ];

  const handleLanguageChange = (newLocale) => {
    setIsOpen(false);
    if (newLocale === locale) return;

    try {
      // Save locale preference to localStorage
      setStoredLocale(newLocale);

      // Get current path and query
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;

      // Remove existing locale from path start
      let path = currentPath;
      if (path.startsWith("/en")) path = path.replace("/en", "");
      else if (path.startsWith("/bn")) path = path.replace("/bn", "");

      // Ensure path consistency
      if (!path.startsWith("/")) path = "/" + path;

      // Force full page reload with new locale
      window.location.href = `/${newLocale}${path}${currentSearch}`;
    } catch (error) {
      console.error("Language switch failed:", error);
      window.location.reload();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
      >
        <Globe
          size={16}
          className="text-white/40 group-hover:text-orange-500 transition-colors"
        />
        <span className="text-xs font-bold text-white uppercase">{locale}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[1003]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-40 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl p-2 z-[1004] animate-in fade-in zoom-in duration-200">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  locale === lang.code
                    ? "bg-orange-500/10 text-orange-500"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.name}</span>
                </div>
                {locale === lang.code && <Check size={14} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
