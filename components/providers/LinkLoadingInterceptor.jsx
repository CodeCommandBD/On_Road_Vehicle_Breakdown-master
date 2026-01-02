"use client";

import { useEffect } from "react";
import { useLoading } from "./LoadingProvider";
import { usePathname } from "next/navigation";

/**
 * Global link click interceptor
 * Catches ALL link clicks and shows loading
 */
export function LinkLoadingInterceptor() {
  const { startLoading, stopLoading } = useLoading();
  const pathname = usePathname();

  useEffect(() => {
    // Stop loading when pathname changes
    stopLoading();
  }, [pathname, stopLoading]);

  useEffect(() => {
    // Intercept all link clicks
    const handleClick = (e) => {
      const link = e.target.closest("a");

      if (link && link.href) {
        const url = new URL(link.href);
        const currentUrl = new URL(window.location.href);

        // Check if it's an internal navigation (same origin)
        if (url.origin === currentUrl.origin) {
          // Check if it's a different page
          if (
            url.pathname !== currentUrl.pathname ||
            url.search !== currentUrl.search
          ) {
            // Show loading immediately
            startLoading();
          }
        }
      }
    };

    // Add click listener to document
    document.addEventListener("click", handleClick, true); // Use capture phase

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [startLoading]);

  return null;
}
