/**
 * Console Suppression Utility
 * Disables console.log in production while keeping errors/warnings
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  // Suppress console.log and console.debug in production
  console.log = () => {};
  console.debug = () => {};

  // Keep console.warn and console.error for critical issues
  // They will still work in production for debugging
}

export default {};
