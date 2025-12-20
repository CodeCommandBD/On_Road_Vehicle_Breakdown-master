import Hero from "@/components/home/Hero";
import RepairServices from "@/components/home/RepairServices";
import SubscriptionSection from "@/components/home/SubscriptionSection";
import TopGarages from "@/components/home/TopGarages";
import Testimonials from "@/components/home/Testimonials";

const servicesData = {
  cars: [
    { icon: "/images/nav/nav-one.png", title: "Windshields", link: "/services" },
    { icon: "/images/nav/nav-two.png", title: "Door", link: "/services" },
    { icon: "/images/nav/nav-three.png", title: "Air Condition", link: "/services" },
    { icon: "/images/nav/nav-four.png", title: "Batteries", link: "/services" },
    { icon: "/images/nav/nav-five.png", title: "Brake", link: "/services" },
    { icon: "/images/nav/nav-six.png", title: "Car Check", link: "/services" },
    { icon: "/images/nav/nav-seven.png", title: "Oil Change", link: "/services" },
    { icon: "/images/nav/nav-eight.png", title: "Suspension", link: "/services" },
  ],
  bikes: [
    { icon: "/images/nav/nav-one.png", title: "Windshields", link: "/services" },
    { icon: "/images/nav/nav-two.png", title: "Door", link: "/services" },
    { icon: "/images/nav/nav-three.png", title: "Air Condition", link: "/services" },
    { icon: "/images/nav/nav-four.png", title: "Batteries", link: "/services" },
    { icon: "/images/nav/nav-five.png", title: "Brake", link: "/services" },
    { icon: "/images/nav/nav-six.png", title: "Bike Check", link: "/services" },
    { icon: "/images/nav/nav-seven.png", title: "Oil Change", link: "/services" },
    { icon: "/images/nav/nav-eight.png", title: "Suspension", link: "/services" },
  ],
};

const testimonials = [
  { name: "Karim Uddin", role: "Truck Driver", rating: 5, text: "Fast, trustworthy and affordable!", avatar: "https://i.pravatar.cc/80?img=1" },
  { name: "Nusrat Jahan", role: "Car Owner", rating: 5, text: "Membership pays for itself.", avatar: "https://i.pravatar.cc/80?img=2" },
  { name: "John Watson", role: "Fleet Manager", rating: 5, text: "Reliable partner for our fleet.", avatar: "https://i.pravatar.cc/80?img=3" },
];

export default function Home() {
  return (
    <>
      <Hero />
      <RepairServices />
      <SubscriptionSection />
      <TopGarages />
      <Testimonials />
    </>
  );
}
