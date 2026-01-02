"use client";

import { useRouter as useNextRouter } from "next/navigation";
import { useRouter as useI18nRouter } from "@/i18n/routing";
import { useLoading } from "@/components/providers/LoadingProvider";
import { useCallback } from "react";

/**
 * Custom hook that wraps Next.js router with loading state
 * SIMPLE TIMEOUT APPROACH - More reliable
 */
export function useRouterWithLoading(useI18n = false) {
  const nextRouter = useNextRouter();
  const i18nRouter = useI18nRouter();
  const router = useI18n ? i18nRouter : nextRouter;
  const { startLoading, stopLoading } = useLoading();

  const push = useCallback(
    (href, options) => {
      startLoading();

      // Navigate immediately
      router.push(href, options);

      // Stop loading after reasonable time
      setTimeout(() => {
        stopLoading();
      }, 1000); // 1 second timeout
    },
    [router, startLoading, stopLoading]
  );

  const replace = useCallback(
    (href, options) => {
      startLoading();
      router.replace(href, options);
      setTimeout(() => {
        stopLoading();
      }, 1000);
    },
    [router, startLoading, stopLoading]
  );

  const back = useCallback(() => {
    startLoading();
    router.back();
    setTimeout(() => {
      stopLoading();
    }, 1000);
  }, [router, startLoading, stopLoading]);

  const forward = useCallback(() => {
    startLoading();
    router.forward();
    setTimeout(() => {
      stopLoading();
    }, 1000);
  }, [router, startLoading, stopLoading]);

  return {
    ...router,
    push,
    replace,
    back,
    forward,
  };
}
