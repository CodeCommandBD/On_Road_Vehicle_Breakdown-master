import { Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import StoreProvider from "@/store/provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "On Road Vehicle Breakdown Service",
  description: "24/7 Vehicle Breakdown Service in Bangladesh",
  keywords: "vehicle, breakdown, service, mechanic, garage, towing, dhaka, bangladesh",
  authors: [{ name: "Md. Redwanul Haque" }, { name: "Md. Afsanur Rahman" }],
  openGraph: {
    title: "On Road Vehicle Breakdown Service",
    description: "Get instant mechanic support anywhere, anytime.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
    <body className={`${inter.variable} font-sans antialiased`}>
        <StoreProvider>
          {children}
          <ToastContainer position="bottom-right" theme="colored" />
        </StoreProvider>
      </body>
    </html>
  );
}
