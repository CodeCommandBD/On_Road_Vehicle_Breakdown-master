"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Mic, Image as ImageIcon, X } from "lucide-react";
import { toast } from "react-toastify";

export default function AdvancedSearch({ onSearch, initialQuery = "" }) {
  const t = useTranslations("Search");
  const [query, setQuery] = useState(initialQuery);
  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.error("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "bn-BD"; // Support Bengali
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      onSearch(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      toast.info("Image search functionality coming soon!");
      // Here we would upload to Cloudinary and send URL to Vision API
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full px-6 py-4 bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-xl pl-12 pr-32 transition-all"
        />

        <Search className="absolute left-4 w-5 h-5 text-gray-400" />

        <div className="absolute right-4 flex items-center gap-2">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                onSearch("");
              }}
              className="p-1.5 hover:bg-gray-700/50 rounded-full text-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="h-6 w-[1px] bg-gray-700" />

          <button
            type="button"
            onClick={handleVoiceSearch}
            className={`p-2 rounded-full transition-all ${
              isListening
                ? "bg-red-500/20 text-red-500 animate-pulse"
                : "hover:bg-gray-700/50 text-gray-400 hover:text-orange-500"
            }`}
            title={t("voiceSearch")}
          >
            <Mic className="w-5 h-5" />
          </button>

          <label
            className="p-2 hover:bg-gray-700/50 rounded-full text-gray-400 hover:text-blue-500 cursor-pointer transition-colors"
            title={t("imageSearch")}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <ImageIcon className="w-5 h-5" />
          </label>
        </div>
      </div>
    </form>
  );
}
