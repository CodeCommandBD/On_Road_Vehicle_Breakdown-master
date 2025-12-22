import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../globals.css";
import StoreProvider from "@/store/provider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

export const metadata = {
  title: "On Road Vehicle Breakdown Service",
  description: "24/7 Vehicle Breakdown Service in Bangladesh",
  keywords:
    "vehicle, breakdown, service, mechanic, garage, towing, dhaka, bangladesh",
  authors: [{ name: "Md. Redwanul Haque" }, { name: "Md. Afsanur Rahman" }],
  openGraph: {
    title: "On Road Vehicle Breakdown Service",
    description: "Get instant mechanic support anywhere, anytime.",
    type: "website",
  },
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
    <html lang={locale} className="scroll-smooth">
      <body className={`font-sans antialiased bg-[#111]`}>
        <NextIntlClientProvider messages={messages}>
          <StoreProvider>
            {children}
            <ToastContainer position="bottom-right" theme="colored" />
          </StoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
