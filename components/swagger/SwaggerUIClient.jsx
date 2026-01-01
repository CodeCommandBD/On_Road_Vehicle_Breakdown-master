"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  ),
  ssr: false,
});

export default function SwaggerUIClient({ spec }) {
  return (
    <section className="container mx-auto py-10">
      <SwaggerUI spec={spec} />
    </section>
  );
}
