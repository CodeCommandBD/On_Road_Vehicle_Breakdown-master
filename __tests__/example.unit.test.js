import { describe, test, expect } from "vitest";

/**
 * Example Unit Test - Newsletter Email Validation
 *
 * This tests a simple utility function that validates email addresses
 */

describe("Email Validation", () => {
  // Helper function to test
  const validateEmail = (email) => {
    if (!email || !email.trim()) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  test("should return true for valid email", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("user.name@domain.co.uk")).toBe(true);
    expect(validateEmail("admin@localhost.com")).toBe(true);
  });

  test("should return false for invalid email", () => {
    expect(validateEmail("invalid-email")).toBe(false);
    expect(validateEmail("missing@domain")).toBe(false);
    expect(validateEmail("@nodomain.com")).toBe(false);
    expect(validateEmail("spaces in@email.com")).toBe(false);
  });

  test("should return false for empty or null input", () => {
    expect(validateEmail("")).toBe(false);
    expect(validateEmail("   ")).toBe(false);
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
  });
});

/**
 * Example: Testing Phone Number Formatting
 */
describe("Phone Number Formatting", () => {
  const formatPhoneNumber = (phone) => {
    if (!phone) return null;

    // Remove spaces and dashes
    let cleaned = phone.replace(/[\s-]/g, "");

    // If already in E.164 format with +88, return as is
    if (cleaned.startsWith("+88")) {
      return cleaned;
    }

    // If starts with 88 but no +, add it
    if (cleaned.startsWith("88")) {
      return "+" + cleaned;
    }

    // If starts with 01 (Bangladeshi format), add +88
    if (cleaned.startsWith("01")) {
      return "+88" + cleaned;
    }

    // Return as is if format is unknown
    return cleaned;
  };

  test("should add +88 prefix to Bangladeshi numbers", () => {
    expect(formatPhoneNumber("01712345678")).toBe("+8801712345678");
    expect(formatPhoneNumber("01812345678")).toBe("+8801812345678");
  });

  test("should keep +88 prefix if already present", () => {
    expect(formatPhoneNumber("+8801712345678")).toBe("+8801712345678");
  });

  test("should add + to numbers starting with 88", () => {
    expect(formatPhoneNumber("8801712345678")).toBe("+8801712345678");
  });

  test("should handle null and empty values", () => {
    expect(formatPhoneNumber(null)).toBe(null);
    expect(formatPhoneNumber("")).toBe(null);
  });

  test("should remove spaces and dashes", () => {
    expect(formatPhoneNumber("017-1234-5678")).toBe("+8801712345678");
    expect(formatPhoneNumber("017 1234 5678")).toBe("+8801712345678");
  });
});

/**
 * Example: Testing Array Operations
 */
describe("Array Utilities", () => {
  test("should filter unique values", () => {
    const arr = [1, 2, 2, 3, 4, 4, 5];
    const unique = [...new Set(arr)];
    expect(unique).toEqual([1, 2, 3, 4, 5]);
  });

  test("should sum array values", () => {
    const numbers = [1, 2, 3, 4, 5];
    const sum = numbers.reduce((acc, curr) => acc + curr, 0);
    expect(sum).toBe(15);
  });
});
