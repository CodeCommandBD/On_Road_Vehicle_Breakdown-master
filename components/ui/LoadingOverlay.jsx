"use client";

import { useEffect } from "react";

export default function LoadingOverlay() {
  useEffect(() => {
    // Create loading overlay in DOM if it doesn't exist
    if (!document.getElementById("global-loading-overlay")) {
      const overlay = document.createElement("div");
      overlay.id = "global-loading-overlay";
      overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading...</div>
      `;
      document.body.appendChild(overlay);
    }
  }, []);

  return null; // This component just ensures the overlay exists
}
