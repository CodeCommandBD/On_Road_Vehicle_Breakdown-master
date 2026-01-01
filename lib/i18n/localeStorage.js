/**
 * Client-side locale storage utilities
 * Persists user's language preference in localStorage
 */

const LOCALE_STORAGE_KEY = "user_locale";

/**
 * Get the current locale from localStorage
 * @returns {string} Current locale (en or bn)
 */
export function getStoredLocale() {
  if (typeof window === "undefined") return "en";

  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY) || "en";
  } catch (error) {
    console.error("Error reading locale from localStorage:", error);
    return "en";
  }
}

/**
 * Save locale to localStorage
 * @param {string} locale - Locale to save (en or bn)
 */
export function setStoredLocale(locale) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.error("Error saving locale to localStorage:", error);
  }
}

/**
 * Clear stored locale
 */
export function clearStoredLocale() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(LOCALE_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing locale from localStorage:", error);
  }
}
