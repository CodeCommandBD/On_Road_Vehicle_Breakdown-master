import Hero from "@/components/home/Hero";
import TrustedBy from "@/components/home/TrustedBy";
import RepairServices from "@/components/home/RepairServices";
import SubscriptionSection from "@/components/home/SubscriptionSection";
import TopGarages from "@/components/home/TopGarages";
import Testimonials from "@/components/home/Testimonials";
import AppPromotion from "@/components/home/AppPromotion";

export default function Home() {
  return (
    <>
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
