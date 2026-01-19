"use client";

import { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  Building2,
  User,
  MessageSquare,
} from "lucide-react";
import { useTranslations } from "next-intl";
import axiosInstance from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";

export default function ContactSalesPage() {
  const t = useTranslations();
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });

  const contactMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post("/api/contact-sales", data);
      return response.data;
    },
    onSuccess: () => {
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        message: "",
      });
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to send message. Please try again or contact us directly.",
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");
    contactMutation.mutate(formData);
  };

  const loading = contactMutation.isPending;

  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            Get in Touch with Our{" "}
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Sales Team
            </span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Interested in our Enterprise plan? Let's discuss custom solutions
            tailored to your business needs.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Thank You!</h3>
                <p className="text-white/60">
                  We've received your message. Our sales team will contact you
                  shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-bold transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-6">Request a Quote</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-orange-500 outline-none transition-colors"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-orange-500 outline-none transition-colors"
                        placeholder="john@company.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-orange-500 outline-none transition-colors"
                        placeholder="+880 1234-567890"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Company Name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-orange-500 outline-none transition-colors"
                        placeholder="Your Company Ltd."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Message *
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-white/40" />
                      <textarea
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-orange-500 outline-none transition-colors min-h-[120px] resize-none"
                        placeholder="Tell us about your requirements..."
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? "Sending..." : "Send Message"}
                    <Send size={20} />
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">
                Why Choose Enterprise?
              </h3>
              <ul className="space-y-4">
                {[
                  "Unlimited service calls & radius",
                  "5-minute SLA response time",
                  "Dedicated account manager",
                  "Custom API access",
                  "White-label reporting",
                  "Priority 24/7 support",
                  "Custom contract terms",
                  "Flexible pricing options",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    </div>
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Phone</p>
                    <p className="font-bold">+880 1234-567890</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Email</p>
                    <p className="font-bold">sales@breakdown.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Location</p>
                    <p className="font-bold">Dhaka, Bangladesh</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full p-8 border border-red-500/20 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Submission Failed
              </h3>
              <p className="text-white/60 mb-6">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage("")}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
