import AboutHero from "@/components/home/AboutHero";
import MissionVision from "@/components/home/MissionVision";
import Statistics from "@/components/home/Statistics";
import TeamShowcase from "@/components/home/TeamShowcase";
import WhyChooseUs from "@/components/home/WhyChooseUs";

export const metadata = {
  title: "About Us | Leading Vehicle Breakdown Service",
  description:
    "Learn about Bangladesh's most trusted 24/7 vehicle breakdown assistance service. Our mission is to provide fast, reliable roadside help to stranded drivers across the country.",
  keywords:
    "about on-road service, vehicle breakdown company, roadside assistance Bangladesh, emergency service provider, trusted mechanic service",
  openGraph: {
    title: "About Us | On-Road Vehicle Service",
    description:
      "Bangladesh's most trusted 24/7 vehicle breakdown assistance service.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <MissionVision />
      <Statistics />
      <WhyChooseUs />
      <TeamShowcase />
    </>
  );
}
