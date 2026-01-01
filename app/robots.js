/**
 * Robots.txt Configuration
 * Controls search engine crawler access
 */

export default function robots() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://on-road-vehicle-service.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/user/dashboard/",
          "/garage/dashboard/",
          "/mechanic/",
          "/_next/",
          "/private/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/user/dashboard/",
          "/garage/dashboard/",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/user/dashboard/",
          "/garage/dashboard/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
