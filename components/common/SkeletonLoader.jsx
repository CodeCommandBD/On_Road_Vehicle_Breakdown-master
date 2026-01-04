/**
 * Reusable Skeleton Loader Components
 * Used for progressive loading with smooth transitions
 */

// Skeleton Card - For garage cards, service cards, etc.
export function SkeletonCard({ className = "" }) {
  return (
    <div
      className={`bg-white/5 rounded-2xl border border-white/10 p-6 animate-pulse ${className}`}
    >
      {/* Image placeholder */}
      <div className="w-full h-48 bg-white/10 rounded-xl mb-4" />

      {/* Title placeholder */}
      <div className="h-6 bg-white/10 rounded-lg w-3/4 mb-3" />

      {/* Description lines */}
      <div className="space-y-2">
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-4 bg-white/10 rounded w-5/6" />
      </div>

      {/* Footer placeholder */}
      <div className="flex gap-2 mt-4">
        <div className="h-8 bg-white/10 rounded-lg w-20" />
        <div className="h-8 bg-white/10 rounded-lg w-24" />
      </div>
    </div>
  );
}

// Skeleton Text - For text lines
export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-white/10 rounded animate-pulse ${
            i === lines - 1 ? "w-3/4" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}

// Skeleton Circle - For avatars, icons
export function SkeletonCircle({ size = "w-12 h-12", className = "" }) {
  return (
    <div
      className={`${size} bg-white/10 rounded-full animate-pulse ${className}`}
    />
  );
}

// Skeleton Grid - For grid layouts
export function SkeletonGrid({
  columns = 3,
  rows = 2,
  gap = "gap-6",
  className = "",
}) {
  const totalItems = columns * rows;

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} ${gap} ${className}`}
    >
      {Array.from({ length: totalItems }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// Skeleton Partner Logo - For trusted partners section
export function SkeletonPartner({ className = "" }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-10 h-10 bg-white/10 rounded animate-pulse" />
      <div className="h-6 bg-white/10 rounded w-24 animate-pulse" />
    </div>
  );
}

// Skeleton Service Card - Specific for services
export function SkeletonServiceCard({ className = "" }) {
  return (
    <div
      className={`bg-white/5 rounded-2xl border border-white/10 p-8 text-center animate-pulse ${className}`}
    >
      {/* Icon placeholder */}
      <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4" />

      {/* Title */}
      <div className="h-6 bg-white/10 rounded-lg w-3/4 mx-auto mb-3" />

      {/* Description */}
      <div className="space-y-2">
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-4 bg-white/10 rounded w-4/5 mx-auto" />
      </div>
    </div>
  );
}

// Fade In Wrapper - For smooth transitions
export function FadeIn({
  children,
  delay = 0,
  duration = 500,
  className = "",
}) {
  return (
    <div
      className={`animate-fadeIn ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        animationFillMode: "both",
      }}
    >
      {children}
    </div>
  );
}
