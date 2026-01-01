"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

/**
 * Lazy load Map Component
 * - Client-side only (Leaflet requires window)
 * - Custom loading skeleton
 */
export const LazyMap = dynamic(() => import("@/components/map/MapComponent"), {
  loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
  ssr: false, // Leaflet only works on client
});

/**
 * Lazy load Chart components (recharts)
 */
export const LazyChart = dynamic(
  () => import("@/components/charts/ChartComponent"),
  {
    loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />,
  }
);

/**
 * Lazy load Analytics Dashboard
 */
export const LazyAnalyticsDashboard = dynamic(
  () => import("@/components/analytics/AnalyticsDashboard"),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-[300px] w-full" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    ),
  }
);

/**
 * Lazy load PDF Viewer
 */
export const LazyPDFViewer = dynamic(
  () => import("@/components/pdf/PDFViewer"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading PDF...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

/**
 * Lazy load Swagger UI
 */
export const LazySwaggerUI = dynamic(() => import("swagger-ui-react"), {
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  ),
  ssr: false,
});
