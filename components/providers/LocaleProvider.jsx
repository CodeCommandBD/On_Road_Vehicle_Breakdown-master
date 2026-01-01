"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getStoredLocale } from "@/lib/i18n/localeStorage";

/**
 * LocaleProvider ensures language persistence across sessions
 * Reads stored locale from localStorage and redirects if necessary
 */
export default function LocaleProvider({ children, currentLocale }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") return;

    // Get stored locale preference
    const storedLocale = getStoredLocale();

    // If stored locale differs from current URL locale, redirect
    if (storedLocale && storedLocale !== currentLocale) {
      // Replace current locale in pathname with stored locale
      const newPathname = pathname.replace(
        `/${currentLocale}`,
        `/${storedLocale}`
      );

      // Redirect to the correct locale
      router.replace(newPathname);
    }
  }, [pathname, currentLocale, router]);

  return <>{children}</>;
}
