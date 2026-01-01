/**
 * Language Alternate Link Component
 * Generates hreflang tags for SEO
 */

"use client";

import { usePathname } from "next/navigation";

export default function LanguageAlternates() {
  const pathname = usePathname();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://on-road-vehicle-service.com";

  // Extract path without locale
  const pathWithoutLocale = pathname.replace(/^\/(en|bn)/, "") || "";

  const enUrl = `${baseUrl}/en${pathWithoutLocale}`;
  const bnUrl = `${baseUrl}/bn${pathWithoutLocale}`;

  return (
    <>
      <link rel="alternate" hrefLang="en-US" href={enUrl} />
      <link rel="alternate" hrefLang="bn-BD" href={bnUrl} />
      <link rel="alternate" hrefLang="x-default" href={enUrl} />
    </>
  );
}
