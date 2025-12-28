"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  ArrowRight,
  Send,
  MapPin,
  Phone,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [footerLinks, setFooterLinks] = useState({
    company: [],
    services: [],
    discover: [],
    help: [],
  });

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await fetch("/api/admin/footer-links");
        const json = await res.json();
        if (json.success) {
          // Group by column
          const grouped = json.data.reduce(
            (acc, link) => {
              if (acc[link.column]) {
                acc[link.column].push(link);
              }
              return acc;
            },
            { company: [], services: [], discover: [], help: [] }
          );
          setFooterLinks(grouped);
        }
      } catch (error) {
        console.error("Failed to load footer links", error);
        // Fallback or leave empty
      }
    };

    fetchLinks();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();

    // Validation
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        setEmail("");
        toast.success(data.message || "Successfully subscribed to newsletter!");

        // Reset success state after 3 seconds
        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
      } else {
        toast.error(data.message || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#020617] border-t border-white/10 pt-20 pb-10 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-xl">
                OR
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                OnRoad<span className="text-orange-500">Help</span>
              </span>
            </Link>
            <p className="text-gray-400 leading-relaxed max-w-sm">
              Your reliable partner for on-road vehicle assistance. fast,
              reliable, and available 24/7 across the country.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <SocialLink href="#" icon={Facebook} />
              <SocialLink href="#" icon={Twitter} />
              <SocialLink href="#" icon={Instagram} />
              <SocialLink href="#" icon={Linkedin} />
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-2 md:col-span-1">
            <h3 className="text-white font-semibold text-lg mb-6">Company</h3>
            <ul className="space-y-4">
              {footerLinks.company.length > 0 ? (
                footerLinks.company.map((link) => (
                  <li key={link._id}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.label}
                    </Link>
                  </li>
                ))
              ) : (
                <p className="text-white/20 text-sm">No links</p>
              )}
            </ul>
          </div>

          <div className="lg:col-span-2 md:col-span-1">
            <h3 className="text-white font-semibold text-lg mb-6">Services</h3>
            <ul className="space-y-4">
              {footerLinks.services.length > 0 ? (
                footerLinks.services.map((link) => (
                  <li key={link._id}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.label}
                    </Link>
                  </li>
                ))
              ) : (
                <p className="text-white/20 text-sm">No links</p>
              )}
            </ul>
          </div>

          <div className="lg:col-span-4 md:col-span-2 bg-white/5 rounded-3xl p-8 border border-white/10">
            <h3 className="text-white font-semibold text-lg mb-2">
              Subscribe to our newsletter
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Get the latest updates, articles, and resources sent to your inbox
              weekly.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isSuccess}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors pl-10 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                {isSuccess && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting || isSuccess}
                className={`w-full font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSuccess
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-orange-500 hover:bg-orange-600 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                } text-white`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subscribing...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Subscribed!
                  </>
                ) : (
                  <>
                    Subscribe
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 mt-16 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm text-center md:text-left">
            © {new Date().getFullYear()} OnRoadHelp. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>Dhaka, Bangladesh</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-500" />
              <span>+880 1234 567890</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon: Icon }) {
  return (
    <a
      href={href}
      className="w-10 h-10 rounded-full bg-white/5 hover:bg-orange-500 text-gray-400 hover:text-white flex items-center justify-center transition-all duration-300 hover:-translate-y-1 border border-white/10 hover:border-orange-500"
    >
      <Icon className="w-5 h-5" />
    </a>
  );
}
