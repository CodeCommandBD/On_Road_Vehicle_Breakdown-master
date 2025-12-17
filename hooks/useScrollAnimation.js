'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook to trigger animations when elements enter viewport
 * Replaces ScrollMagic from Vue project
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Intersection threshold (0-1)
 * @param {string} options.triggerOnce - Whether to trigger animation only once
 * @returns {Object} - ref and isVisible state
 */
export function useScrollAnimation({
  threshold = 0.1,
  triggerOnce = true,
  rootMargin = '0px',
} = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, triggerOnce, rootMargin]);

  return { ref, isVisible };
}

/**
 * Hook for multiple elements with scroll animation
 * 
 * @param {number} count - Number of elements
 * @param {Object} options - Configuration options
 * @returns {Array} - Array of {ref, isVisible} objects
 */
export function useScrollAnimationList(count, options = {}) {
  const refs = useRef([]);
  const [visibleStates, setVisibleStates] = useState(Array(count).fill(false));

  useEffect(() => {
    const observers = refs.current.map((element, index) => {
      if (!element) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleStates((prev) => {
              const newStates = [...prev];
              newStates[index] = true;
              return newStates;
            });
            if (options.triggerOnce !== false) {
              observer.unobserve(element);
            }
          }
        },
        {
          threshold: options.threshold || 0.1,
          rootMargin: options.rootMargin || '0px',
        }
      );

      observer.observe(element);
      return observer;
    });

    return () => {
      observers.forEach((observer, index) => {
        if (observer && refs.current[index]) {
          observer.unobserve(refs.current[index]);
        }
      });
    };
  }, [count, options.threshold, options.triggerOnce, options.rootMargin]);

  const setRef = (index) => (el) => {
    refs.current[index] = el;
  };

  return visibleStates.map((isVisible, index) => ({
    ref: setRef(index),
    isVisible,
  }));
}
