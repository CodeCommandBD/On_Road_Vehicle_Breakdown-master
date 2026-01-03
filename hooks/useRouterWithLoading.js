"use client";

import { useRouter as useNextRouter } from "next/navigation";
import { useRouter as useI18nRouter } from "@/i18n/routing";
import { useLoading } from "@/components/providers/LoadingProvider";
import { useCallback, useMemo } from "react";

/**
 * Custom hook that wraps Next.js router with loading state
 * Uses simple timeout approach for reliability
 */
export function useRouterWithLoading(useI18n = false) {
  const nextRouter = useNextRouter();
  const i18nRouter = useI18nRouter();
  const router = useI18n ? i18nRouter : nextRouter;
  const { startLoading, stopLoading } = useLoading();

  const push = useCallback(
    (href, options) => {
      // Start loading immediately
      startLoading();

      // Navigate
      router.push(href, options);

      // Stop loading after 800ms (enough time for page to load)
      setTimeout(() => {
        stopLoading();
      }, 800);
    },
    [router, startLoading, stopLoading]
  );

  const replace = useCallback(
    (href, options) => {
      startLoading();
      router.replace(href, options);
      setTimeout(() => {
        stopLoading();
      }, 800);
    },
    [router, startLoading, stopLoading]
  );

  const back = useCallback(() => {
    startLoading();
    router.back();
    setTimeout(() => {
      stopLoading();
    }, 800);
  }, [router, startLoading, stopLoading]);

  const forward = useCallback(() => {
    startLoading();
    router.forward();
    setTimeout(() => {
      stopLoading();
    }, 800);
  }, [router, startLoading, stopLoading]);

  return useMemo(
    () => ({
      ...router,
      push,
      replace,
      back,
      forward,
    }),
    [router, push, replace, back, forward]
  );
}
