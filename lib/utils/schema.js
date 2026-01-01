/**
 * Schema.org Structured Data Generators
 * Creates JSON-LD schemas for SEO
 */

const APP_NAME = "On-Road Vehicle Service";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://on-road-vehicle-service.com";

/**
 * Generate LocalBusiness schema
 */
export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${APP_URL}/#organization`,
    name: APP_NAME,
    description:
      "24/7 Vehicle Breakdown Service in Bangladesh. Emergency roadside assistance, towing, and repair services.",
    url: APP_URL,
    logo: `${APP_URL}/logo.png`,
    image: `${APP_URL}/og-home.jpg`,
    telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+8801711223344", // Real number from env
    email:
      process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
      "support@on-road-vehicle-service.com",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressCountry: "BD",
      addressLocality: "Dhaka",
      addressRegion: "Dhaka Division",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 23.8103,
      longitude: 90.4125,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "00:00",
      closes: "23:59",
    },
    sameAs: [
      // TODO: Add social media links
      "https://facebook.com/onroadservice",
      "https://twitter.com/onroadservice",
    ],
    areaServed: {
      "@type": "Country",
      name: "Bangladesh",
    },
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${APP_URL}/#organization`,
    name: APP_NAME,
    url: APP_URL,
    logo: {
      "@type": "ImageObject",
      url: `${APP_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+8801711223344",
      contactType: "Customer Service",
      areaServed: "BD",
      availableLanguage: ["English", "Bengali"],
    },
    sameAs: [
      "https://facebook.com/onroadservice",
      "https://twitter.com/onroadservice",
    ],
  };
}

/**
 * Generate Service schema
 */
export function generateServiceSchema(service) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    provider: {
      "@type": "LocalBusiness",
      name: APP_NAME,
      url: APP_URL,
    },
    areaServed: {
      "@type": "Country",
      name: "Bangladesh",
    },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${APP_URL}/services`,
      servicePhone: {
        "@type": "ContactPoint",
        telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+8801711223344",
        contactType: "Customer Service",
      },
    },
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${APP_URL}${item.path}`,
    })),
  };
}

/**
 * Generate WebSite schema
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${APP_URL}/#website`,
    url: APP_URL,
    name: APP_NAME,
    description: "24/7 Vehicle Breakdown Service in Bangladesh",
    publisher: {
      "@id": `${APP_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${APP_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: ["en-US", "bn-BD"],
  };
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export default {
  generateLocalBusinessSchema,
  generateOrganizationSchema,
  generateServiceSchema,
  generateBreadcrumbSchema,
  generateWebSiteSchema,
  generateFAQSchema,
};
