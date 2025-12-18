"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils/helpers";

export default function Breadcrumb() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter((segment) => segment !== "");

  // Helper to format segments
  const formatSegment = (segment) => {
    // Remove ID-like strings (Mongoose IDs are 24 chars)
    if (segment.length === 24 && /^[0-9a-fA-F]+$/.test(segment)) {
      return "Details";
    }
    return segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 overflow-x-auto whitespace-nowrap scrollbar-hide py-2">
      <Link
        href="/"
        className="hover:text-primary transition-colors flex items-center gap-1"
      >
        <Home className="w-4 h-4" />
      </Link>

      {pathSegments.map((segment, index) => {
        let href = `/${pathSegments.slice(0, index + 1).join("/")}`;
        const isLast = index === pathSegments.length - 1;

        // Custom redirect for role segments that don't have valid landing pages
        const isRoleSegment = ["user", "admin", "garage"].includes(
          segment.toLowerCase()
        );
        if (isRoleSegment && !isLast) {
          href = "/";
        }

        return (
          <div key={href + index} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
            <Link
              href={href}
              className={cn(
                "transition-colors",
                isLast
                  ? "text-primary font-semibold pointer-events-none"
                  : "hover:text-primary"
              )}
            >
              {formatSegment(segment)}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
