import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../globals.css";
import StoreProvider from "@/store/provider";
import QueryProvider from "@/providers/QueryProvider";
import SessionProvider from "@/providers/SessionProvider";
import NotificationListener from "@/components/providers/NotificationListener";
import PWAInstallPrompt from "@/components/common/PWAInstallPrompt";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { CsrfProvider } from "@/lib/context/CsrfContext";
import { Inter } from "next/font/google";
import LanguageAlternates from "@/components/seo/LanguageAlternates";
import LocaleProvider from "@/components/providers/LocaleProvider";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { LinkLoadingInterceptor } from "@/components/providers/LinkLoadingInterceptor";
import "@/lib/utils/console-suppressor"; // Suppress console.log in production

// Configure Inter font
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  fallback: ["system-ui", "arial"],
});

export const metadata = {
  title: {
    default: "On-Road Vehicle Service | 24/7 Breakdown Assistance",
    template: "%s | On-Road Vehicle Service",
  },
  description:
    "24/7 Vehicle Breakdown Service in Bangladesh. Get instant mechanic support anywhere, anytime. Emergency roadside assistance, towing, and repair services.",
  keywords:
    "vehicle breakdown, emergency service, mechanic, garage, towing, roadside assistance, Bangladesh, Dhaka, vehicle repair",
  authors: [{ name: "Md. Redwanul Haque" }, { name: "Md. Afsanur Rahman" }],
  creator: "On-Road Vehicle Service Team",
  publisher: "On-Road Vehicle Service",
  openGraph: {
    title: "On-Road Vehicle Service | 24/7 Breakdown Assistance",
    description:
      "Get instant mechanic support anywhere, anytime in Bangladesh.",
    type: "website",
    locale: "en_US",
    siteName: "On-Road Vehicle Service",
  },
  twitter: {
    card: "summary_large_image",
    title: "On-Road Vehicle Service",
    description: "24/7 Vehicle Breakdown Service in Bangladesh",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "On-Road Service",
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
};

export const viewport = {
  themeColor: "#e85d04",
};

export default async function RootLayout({ children, params }) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} className={`scroll-smooth ${inter.variable}`}>
      <head>
        <LanguageAlternates />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "On-Road Vehicle Service",
              url:
                process.env.NEXT_PUBLIC_APP_URL ||
                "https://on-road-vehicle-service.com",
              logo: `${
                process.env.NEXT_PUBLIC_APP_URL ||
                "https://on-road-vehicle-service.com"
              }/images/nav/main-logo.svg`,
              contactPoint: {
                "@type": "ContactPoint",
                telephone:
                  process.env.NEXT_PUBLIC_COMPANY_PHONE || "+8801XXXXXXXXX",
                contactType: "customer service",
                areaServed: "BD",
                availableLanguage: ["en", "bn"],
              },
              description:
                "24/7 Vehicle Breakdown Service in Bangladesh. Get instant mechanic support anywhere, anytime.",
            }),
          }}
        />
        {/* Structured Data - Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "On-Road Vehicle Breakdown Service",
              url:
                process.env.NEXT_PUBLIC_APP_URL ||
                "https://on-road-vehicle-service.com",
              logo: `${
                process.env.NEXT_PUBLIC_APP_URL ||
                "https://on-road-vehicle-service.com"
              }/logo.png`,
              description:
                "24/7 vehicle breakdown assistance service in Bangladesh",
              address: {
                "@type": "PostalAddress",
                addressCountry: "BD",
                addressLocality: "Dhaka",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone:
                  process.env.NEXT_PUBLIC_COMPANY_PHONE || "+8801XXXXXXXXX",
                contactType: "Customer Service",
                availableLanguage: ["English", "Bengali"],
                areaServed: "BD",
              },
            }),
          }}
        />
      </head>
      <body className={`font-sans antialiased bg-[#020617]`}>
        <NextIntlClientProvider messages={messages}>
          <CsrfProvider>
            <SessionProvider>
              <StoreProvider>
                <QueryProvider>
                  <LoadingProvider>
                    <LocaleProvider currentLocale={locale}>
                      <LinkLoadingInterceptor />
                      {children}
                      <NotificationListener />
                      <PWAInstallPrompt />
                      <ToastContainer position="bottom-right" theme="colored" />
                      <LoadingOverlay />
                    </LocaleProvider>
                  </LoadingProvider>
                </QueryProvider>
              </StoreProvider>
            </SessionProvider>
          </CsrfProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
