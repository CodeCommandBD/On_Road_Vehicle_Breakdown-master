/**
 * Lazy Loading Component Wrappers
 * Dynamic imports for heavy components to reduce bundle size
 */

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

/**
 * Loading skeleton for maps
 */
const MapSkeleton = () => (
  <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
      <p className="text-sm text-gray-500">Loading map...</p>
    </div>
  </div>
);

/**
 * Loading skeleton for charts
 */
const ChartSkeleton = () => (
  <div className="w-full h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
      <p className="text-sm text-gray-500">Loading chart...</p>
    </div>
  </div>
);

/**
 * Lazy load Map component (react-leaflet)
 * Saves ~70KB from initial bundle
 * COMMENTED OUT: Component does not exist
 */
// export const LazyMap = dynamic(
//   () =>
//     import("@/components/map/MapComponent").catch(() => ({
//       default: () => <div>Map not available</div>,
//     })),
//   {
//     loading: () => <MapSkeleton />,
//     ssr: false, // Don't render on server (maps need browser APIs)
//   }
// );

/**
 * Lazy load Chart components (recharts)
 * Saves ~80KB from initial bundle
 * COMMENTED OUT: Component does not exist
 */
// export const LazyChart = dynamic(
//   () =>
//     import("@/components/charts/ChartComponent").catch(() => ({
//       default: () => <div>Chart not available</div>,
//     })),
//   {
//     loading: () => <ChartSkeleton />,
//   }
// );

/**
 * Lazy load Analytics Dashboard
 * Saves ~100KB from initial bundle
 * COMMENTED OUT: Component does not exist
 */
// export const LazyAnalyticsDashboard = dynamic(
//   () => import("@/components/analytics/AnalyticsDashboard"),
//   {
//     loading: () => (
//       <div className="flex items-center justify-center h-96">
//         <Loader2 className="w-12 h-12 animate-spin text-primary" />
//       </div>
//     ),
//   }
// );

/**
 * Lazy load PDF Viewer
 * Saves ~50KB from initial bundle
 * COMMENTED OUT: Component does not exist
 */
// export const LazyPDFViewer = dynamic(
//   () => import("@/components/pdf/PDFViewer"),
//   {
//     loading: () => (
//       <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
//         <div className="text-center">
//           <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
//           <p className="text-sm text-gray-500">Loading PDF...</p>
//         </div>
//       </div>
//     ),
//     ssr: false,
//   }
// );

/**
 * Lazy load Swagger UI
 * Saves ~100KB from initial bundle
 */
export const LazySwaggerUI = dynamic(() => import("swagger-ui-react"), {
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  ),
  ssr: false,
});

export default {
  // LazyMap,
  // LazyChart,
  // LazyAnalyticsDashboard,
  // LazyPDFViewer,
  LazySwaggerUI,
};
