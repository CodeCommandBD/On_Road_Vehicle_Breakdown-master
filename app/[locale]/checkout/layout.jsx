export const metadata = {
  title: "Checkout | On-Road Vehicle Service",
  description:
    "Complete your subscription purchase securely. Choose your plan and get access to premium vehicle breakdown services.",
  keywords: "checkout, payment, subscription, premium service",
  openGraph: {
    title: "Checkout | On-Road Vehicle Service",
    description: "Complete your subscription purchase securely.",
    type: "website",
  },
  robots: "noindex, nofollow", // Checkout page - don't index
};

export default function CheckoutLayout({ children }) {
  return children;
}
