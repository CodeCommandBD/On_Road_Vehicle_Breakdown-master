"use client";

import { useLoading } from "@/components/providers/LoadingProvider";
import { Wrench } from "lucide-react";

/**
 * Global Loading Overlay component.
 * Renders a full-screen loading state with the thematic Wrench icon.
 */
export default function LoadingOverlay() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-black/60 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="relative">
        {/* Decorative Glow */}
        <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>

        {/* Spinning Wrench */}
        <Wrench
          className="w-16 h-16 text-orange-500 animate-spin relative z-10"
          strokeWidth={2.5}
        />
      </div>

      {/* Loading Text */}
      <h2 className="mt-8 text-white font-bold text-xl tracking-[0.2em] uppercase animate-pulse">
        Loading...
      </h2>
    </div>
  );
}
