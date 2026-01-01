import Hero from "@/components/home/Hero";
import TrustedBy from "@/components/home/TrustedBy";
import RepairServices from "@/components/home/RepairServices";
import SubscriptionSection from "@/components/home/SubscriptionSection";
import TopGarages from "@/components/home/TopGarages";
import Testimonials from "@/components/home/Testimonials";
import AppPromotion from "@/components/home/AppPromotion";
import StructuredData from "@/components/seo/StructuredData";
import {
  generateLocalBusinessSchema,
  generateWebSiteSchema,
} from "@/lib/utils/schema";

export const metadata = {
  title: "24/7 Emergency Vehicle Breakdown Service in Bangladesh",
  description:
    "Get instant roadside assistance anywhere in Bangladesh. Professional mechanics, towing services, and emergency repairs available 24/7. Fast response time guaranteed.",
  keywords:
    "vehicle breakdown Bangladesh, emergency roadside assistance, 24/7 mechanic service, towing service Dhaka, car repair Bangladesh, vehicle rescue, breakdown help",
  openGraph: {
    title: "On-Road Vehicle Service | 24/7 Emergency Assistance",
    description:
      "Get instant roadside assistance anywhere in Bangladesh. Professional mechanics available 24/7.",
    type: "website",
    images: [
      {
        url: "/og-home.jpg",
        width: 1200,
        height: 630,
        alt: "On-Road Vehicle Service - Emergency Breakdown Assistance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "On-Road Vehicle Service | 24/7 Emergency Assistance",
    description: "Get instant roadside assistance anywhere in Bangladesh.",
  },
};

export default function Home() {
  const schemas = [generateLocalBusinessSchema(), generateWebSiteSchema()];

  return (
    <>
      <StructuredData schema={schemas} />
      <Hero />
      <TrustedBy />
      <RepairServices />
      <SubscriptionSection />
      <TopGarages />
      <AppPromotion />
      <Testimonials />
    </>
  );
}
