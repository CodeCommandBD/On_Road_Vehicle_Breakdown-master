/**
 * SEO Metadata Generator Utility
 * Generates consistent metadata for all pages
 */

const APP_NAME = "On-Road Vehicle Service";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://on-road-vehicle-service.com";
const DEFAULT_DESCRIPTION =
  "24/7 Vehicle Breakdown Service in Bangladesh. Get instant mechanic support anywhere, anytime.";
const DEFAULT_KEYWORDS =
  "vehicle breakdown, emergency service, mechanic, garage, towing, roadside assistance, Bangladesh, Dhaka";

/**
 * Generate page metadata
 * @param {Object} options - Metadata options
 * @returns {Object} Next.js metadata object
 */
export function generateMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  path = "/",
  image = "/og-image.jpg",
  type = "website",
  locale = "en",
  noIndex = false,
}) {
  const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
  const url = `${APP_URL}${path}`;

  return {
    title: fullTitle,
    description,
    keywords,
    authors: [{ name: "Md. Redwanul Haque" }, { name: "Md. Afsanur Rahman" }],
    robots: noIndex ? "noindex, nofollow" : "index, follow",

    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: APP_NAME,
      images: [
        {
          url: `${APP_URL}${image}`,
          width: 1200,
          height: 630,
          alt: title || APP_NAME,
        },
      ],
      locale,
      type,
    },

    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [`${APP_URL}${image}`],
      creator: "@onroadservice",
    },

    alternates: {
      canonical: url,
      languages: {
        en: `${APP_URL}/en${path}`,
        bn: `${APP_URL}/bn${path}`,
      },
    },

    verification: {
      google: "your-google-verification-code",
      // yandex: "your-yandex-verification-code",
      // bing: "your-bing-verification-code",
    },
  };
}

/**
 * Generate metadata for authentication pages
 */
export const authMetadata = {
  login: generateMetadata({
    title: "Login",
    description:
      "Login to access 24/7 vehicle breakdown assistance. Secure access for users, garages, mechanics, and admins.",
    keywords: "login, sign in, vehicle service, breakdown assistance",
    path: "/login",
  }),

  signup: generateMetadata({
    title: "Sign Up",
    description:
      "Create an account to access emergency vehicle breakdown services. Join as a user, garage owner, or mechanic.",
    keywords: "signup, register, create account, vehicle service",
    path: "/signup",
  }),

  forgotPassword: generateMetadata({
    title: "Forgot Password",
    description:
      "Reset your password securely. Get back access to your vehicle breakdown service account.",
    keywords: "forgot password, reset password, account recovery",
    path: "/forgot-password",
  }),

  resetPassword: generateMetadata({
    title: "Reset Password",
    description:
      "Set a new password for your account. Secure password reset for vehicle breakdown service.",
    keywords: "reset password, new password, account security",
    path: "/reset-password",
  }),
};

/**
 * Generate metadata for dashboard pages
 */
export const dashboardMetadata = {
  user: generateMetadata({
    title: "User Dashboard",
    description:
      "Manage your vehicle breakdown requests, bookings, and service history.",
    keywords: "user dashboard, my bookings, service history",
    path: "/user/dashboard",
    noIndex: true, // Private page
  }),

  garage: generateMetadata({
    title: "Garage Dashboard",
    description:
      "Manage your garage services, bookings, and customer requests.",
    keywords: "garage dashboard, service management, bookings",
    path: "/garage/dashboard",
    noIndex: true,
  }),

  mechanic: generateMetadata({
    title: "Mechanic Dashboard",
    description: "View and manage your service requests and customer jobs.",
    keywords: "mechanic dashboard, service requests, jobs",
    path: "/mechanic/dashboard",
    noIndex: true,
  }),

  admin: generateMetadata({
    title: "Admin Dashboard",
    description: "System administration and management panel.",
    keywords: "admin dashboard, system management",
    path: "/admin",
    noIndex: true,
  }),
};

/**
 * Generate metadata for service pages
 */
export function generateServiceMetadata(serviceName, description) {
  return generateMetadata({
    title: serviceName,
    description:
      description ||
      `Professional ${serviceName} service in Bangladesh. 24/7 emergency assistance.`,
    keywords: `${serviceName}, vehicle service, emergency repair, Bangladesh`,
    path: `/services/${serviceName.toLowerCase().replace(/\s+/g, "-")}`,
  });
}

/**
 * Generate metadata for location pages
 */
export function generateLocationMetadata(location) {
  return generateMetadata({
    title: `Vehicle Breakdown Service in ${location}`,
    description: `24/7 emergency vehicle breakdown service in ${location}, Bangladesh. Fast response, professional mechanics.`,
    keywords: `vehicle breakdown ${location}, mechanic ${location}, towing ${location}, roadside assistance ${location}`,
    path: `/locations/${location.toLowerCase().replace(/\s+/g, "-")}`,
  });
}

export default {
  generateMetadata,
  authMetadata,
  dashboardMetadata,
  generateServiceMetadata,
  generateLocationMetadata,
};
