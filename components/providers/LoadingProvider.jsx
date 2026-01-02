"use client";

import { createContext, useContext, useState, useCallback } from "react";

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = useCallback(() => {
    // Add loading class to body IMMEDIATELY (synchronous)
    document.body.classList.add("page-loading");
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    // Remove loading class from body
    document.body.classList.remove("page-loading");
    setIsLoading(false);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
}
