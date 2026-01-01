/**
 * Lazy Section Component
 * Uses Intersection Observer to lazy load below-the-fold content
 */

"use client";

import { useEffect, useRef, useState } from "react";

export function LazySection({
  children,
  threshold = 0.1,
  rootMargin = "50px",
  fallback = null,
  minHeight = "auto",
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return (
    <div ref={ref} style={{ minHeight }}>
      {isVisible ? children : fallback || <div style={{ minHeight }} />}
    </div>
  );
}

export default LazySection;
