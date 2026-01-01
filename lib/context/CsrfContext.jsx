"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CsrfContext = createContext(null);

export function CsrfProvider({ children }) {
  const [csrfToken, setCsrfToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch CSRF token on mount
    fetchCsrfToken();
  }, []);

  const fetchCsrfToken = async () => {
    try {
      const response = await fetch("/api/csrf-token");
      const data = await response.json();

      if (data.success && data.csrfToken) {
        setCsrfToken(data.csrfToken);
        // Store in sessionStorage for persistence
        sessionStorage.setItem("csrf-token", data.csrfToken);
      }
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    setLoading(true);
    await fetchCsrfToken();
  };

  return (
    <CsrfContext.Provider value={{ csrfToken, loading, refreshToken }}>
      {children}
    </CsrfContext.Provider>
  );
}

export function useCsrf() {
  const context = useContext(CsrfContext);
  if (!context) {
    throw new Error("useCsrf must be used within CsrfProvider");
  }
  return context;
}

/**
 * Helper function to add CSRF token to fetch requests
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
export async function fetchWithCsrf(url, options = {}) {
  const csrfToken = sessionStorage.getItem("csrf-token");

  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
  };

  // Add CSRF token for state-changing methods
  if (
    ["POST", "PUT", "DELETE", "PATCH"].includes(options.method?.toUpperCase())
  ) {
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
