"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoading } from "./LoadingProvider";

/**
 * Global navigation listener that stops loading when page loads
 */
export function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { stopLoading } = useLoading();

  const isInitialized = useRef(false);
  const prevPathname = useRef(pathname);
  const prevSearchParams = useRef(searchParams?.toString());

  useEffect(() => {
    // Skip first render (initial page load)
    if (!isInitialized.current) {
      isInitialized.current = true;
      prevPathname.current = pathname;
      prevSearchParams.current = searchParams?.toString();
      return;
    }

    const currentPath = pathname;
    const currentSearch = searchParams?.toString();

    // Only stop loading if route actually changed
    if (
      prevPathname.current !== currentPath ||
      prevSearchParams.current !== currentSearch
    ) {
      // Route changed, stop loading
      stopLoading();

      // Update refs
      prevPathname.current = currentPath;
      prevSearchParams.current = currentSearch;
    }
  }, [pathname, searchParams, stopLoading]);

  return null;
}
