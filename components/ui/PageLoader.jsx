"use client";

import { useEffect, useState } from "react";
import "./PageLoader.css";

export default function PageLoader() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = sessionStorage.getItem("hasVisited");

    if (hasVisited) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setFadeOut(true);
      sessionStorage.setItem("hasVisited", "true");
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className={`page-loader ${fadeOut ? "fade-out" : ""}`}>
      <div className="loader-content">
        <div className="wheel-container">
          <div className="speed-lines">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            {/* Added more lines for left side intensity */}
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="large-wheel">
            <div className="tire"></div>
            <div className="rim">
              <div className="rim-inner">
                <div className="spoke p1"></div>
                <div className="spoke p2"></div>
                <div className="spoke p3"></div>
                <div className="spoke p4"></div>
                <div className="center-cap"></div>
              </div>
            </div>
            {/* Brake Caliper (Static relative to wheel rotation) */}
            <div className="caliper"></div>
          </div>

          <div className="smoke-container">
            <div className="smoke s1"></div>
            <div className="smoke s2"></div>
            <div className="smoke s3"></div>
            <div className="smoke s4"></div>
          </div>
        </div>

        <div className="loading-text">
          <span>Loading</span>
          <span className="dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      </div>
    </div>
  );
}
