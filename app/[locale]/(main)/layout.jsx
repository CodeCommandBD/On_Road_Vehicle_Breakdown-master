import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const navLinks = [
  { label: "Home", href: "#hero" },
  { label: "Services", href: "#services" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
];

const footerColumns = [
  { title: "Company", links: [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Jobs", href: "/jobs" },
    { label: "Blog", href: "/blog" },
    { label: "Career", href: "/career" },
  ]},
  { title: "Product", links: [
    { label: "Details", href: "/details" },
    { label: "Features", href: "/features" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Status", href: "/status" },
    { label: "API", href: "/api" },
  ]},
  { title: "Discover", links: [
    { label: "Partner Program", href: "/partner" },
    { label: "Newsletter", href: "/newsletter" },
    { label: "How it works", href: "/how-it-works" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Team of Service", href: "/team" },
  ]},
  { title: "Help Center", links: [
    { label: "Community", href: "/community" },
    { label: "Knowledge", href: "/knowledge" },
    { label: "Terms & Condition", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
    { label: "Support", href: "/support" },
  ]},
];

const socialLinks = [
  { href: "#", label: "Facebook" },
  { href: "#", label: "Twitter" },
  { href: "#", label: "Instagram" },
  { href: "#", label: "LinkedIn" },
];

const footerHero = {
  title: "Service",
  description:
    "We provide online and integrated audio-visual solutions for schools, government, and businesses, enhancing communication and collaboration.",
  socialImages: [
    { src: "/images/footer/Facebook.png", alt: "Facebook" },
    { src: "/images/footer/Facebook.png", alt: "Twitter" },
    { src: "/images/footer/Facebook.png", alt: "Instagram" },
    { src: "/images/footer/Facebook.png", alt: "LinkedIn" },
  ],
};

const footerBackgroundImage = "/images/footer/Footer-bg.png";

export default function MainLayout({ children }) {
  return (
    <>
      <Navbar logoText="ON ROAD" navLinks={navLinks} ctaText="BOOK SERVICE" />
      <main>{children}</main>
      <Footer
        columns={footerColumns}
        socialLinks={socialLinks}
        hero={footerHero}
        backgroundImage={footerBackgroundImage}
      />
    </>
  );
}
