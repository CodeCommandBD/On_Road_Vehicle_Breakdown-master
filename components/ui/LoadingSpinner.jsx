"use client";

import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils/helpers";

/**
 * Standard Loading Spinner for the application.
 * Uses the Wrench icon as requested by the user.
 */
export default function LoadingSpinner({ className, size = 24 }) {
  return (
    <Wrench
      className={cn("animate-spin text-[#FF532D]", className)}
      size={size}
    />
  );
}
