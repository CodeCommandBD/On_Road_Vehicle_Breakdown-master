/**
 * Structured Data (JSON-LD) Schemas
 * For better SEO and rich snippets in search results
 */

/**
 * Organization Schema
 * Represents the company/organization
 */
export function getOrganizationSchema() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://on-road-vehicle-service.com";

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "On-Road Vehicle Breakdown Service",
    alternateName: "Quick Vehicle Service",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      "24/7 vehicle breakdown assistance service in Bangladesh. Emergency roadside assistance, towing, and repair services.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "BD",
      addressLocality: "Dhaka",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "+880-1XXX-XXXXXX",
      contactType: "Customer Service",
      availableLanguage: ["English", "Bengali"],
      areaServed: "BD",
    },
    sameAs: [
      // Add social media links when available
      // 'https://facebook.com/yourpage',
      // 'https://twitter.com/yourhandle',
    ],
  };
}

/**
 * LocalBusiness Schema
 * For garage/service provider pages
 */
export function getLocalBusinessSchema(garage) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://on-road-vehicle-service.com";

  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: garage.name,
    image: garage.logo || garage.images?.[0],
    "@id": `${baseUrl}/garages/${garage._id}`,
    url: `${baseUrl}/garages/${garage._id}`,
    telephone: garage.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: garage.address?.street,
      addressLocality: garage.address?.city,
      addressRegion: garage.address?.district,
      postalCode: garage.address?.postalCode,
      addressCountry: "BD",
    },
    geo: garage.location?.coordinates
      ? {
          "@type": "GeoCoordinates",
          latitude: garage.location.coordinates[1],
          longitude: garage.location.coordinates[0],
        }
      : undefined,
    openingHoursSpecification: garage.hours
      ? {
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
          opens: garage.hours.open,
          closes: garage.hours.close,
        }
      : undefined,
    priceRange: "৳৳",
    aggregateRating: garage.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: garage.rating.average,
          reviewCount: garage.rating.count,
        }
      : undefined,
  };
}

/**
 * Service Schema
 * For service offering pages
 */
export function getServiceSchema(service) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://on-road-vehicle-service.com";

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.name,
    provider: {
      "@type": "Organization",
      name: "On-Road Vehicle Breakdown Service",
    },
    areaServed: {
      "@type": "Country",
      name: "Bangladesh",
    },
    description: service.description,
    offers: service.price
      ? {
          "@type": "Offer",
          price: service.price,
          priceCurrency: "BDT",
        }
      : undefined,
  };
}

/**
 * BreadcrumbList Schema
 * For navigation breadcrumbs
 */
export function getBreadcrumbSchema(items) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://on-road-vehicle-service.com";

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  };
}

/**
 * FAQ Schema
 * For FAQ pages
 */
export function getFAQSchema(faqs) {
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

/**
 * Helper to inject schema into page
 */
export function injectSchema(schema) {
  return {
    __html: JSON.stringify(schema),
  };
}
