import { describe, test, expect } from "vitest";
import {
  loginSchema,
  signupSchema,
  bookingSchema,
} from "@/lib/validations/auth";

/**
 * Unit Tests for Validation Schemas
 * Tests Zod schemas for login, signup, and booking validation
 */

describe("Login Schema Validation", () => {
  test("should accept valid email and password", () => {
    const validData = {
      email: "user@example.com",
      password: "Password123!",
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test("should accept valid email format", () => {
    const validData = {
      email: "user@example.com",
      password: "Password123!",
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test("should reject invalid email format", () => {
    const invalidData = {
      email: "not-an-email",
      password: "Password123!",
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test("should reject missing fields", () => {
    const result1 = loginSchema.safeParse({ email: "test@test.com" });
    const result2 = loginSchema.safeParse({ password: "Password123!" });

    expect(result1.success).toBe(false);
    expect(result2.success).toBe(false);
  });
});

describe("Signup Schema Validation", () => {
  test("should accept valid signup data", () => {
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      password: "SecurePass123!",
      phone: "01712345678",
      role: "user",
    };

    const result = signupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test("should reject weak password", () => {
    const invalidData = {
      name: "John Doe",
      email: "john@example.com",
      password: "weak",
      phone: "01712345678",
    };

    const result = signupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test("should reject invalid phone number", () => {
    const invalidData = {
      name: "John Doe",
      email: "john@example.com",
      password: "SecurePass123!",
      phone: "123", // Too short
    };

    const result = signupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test("should reject short name", () => {
    const invalidData = {
      name: "J",
      email: "john@example.com",
      password: "SecurePass123!",
      phone: "01712345678",
    };

    const result = signupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test("should accept valid role", () => {
    const roles = ["user", "garage", "admin"];

    roles.forEach((role) => {
      const data = {
        name: "Test User",
        email: "test@example.com",
        password: "Password123!",
        phone: "01712345678",
        role,
      };

      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

describe("Email Validation Helper", () => {
  const validateEmail = (email) => {
    if (!email || !email.trim()) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  test("should validate correct email formats", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("test.user@domain.co.uk")).toBe(true);
    expect(validateEmail("admin+tag@localhost.com")).toBe(true);
  });

  test("should reject incorrect email formats", () => {
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("@nodomain.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
    expect(validateEmail("user @domain.com")).toBe(false);
  });

  test("should reject empty values", () => {
    expect(validateEmail("")).toBe(false);
    expect(validateEmail("   ")).toBe(false);
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
  });
});

describe("Phone Number Validation", () => {
  const validateBDPhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s-]/g, "");

    // Bangladesh phone: starts with 01, 11 digits total
    const bdRegex = /^01[3-9]\d{8}$/;
    return bdRegex.test(cleaned);
  };

  test("should validate Bangladeshi phone numbers", () => {
    expect(validateBDPhone("01712345678")).toBe(true);
    expect(validateBDPhone("01812345678")).toBe(true);
    expect(validateBDPhone("01912345678")).toBe(true);
  });

  test("should accept phone with spaces/dashes", () => {
    expect(validateBDPhone("017-1234-5678")).toBe(true);
    expect(validateBDPhone("017 1234 5678")).toBe(true);
  });

  test("should reject invalid BD phone numbers", () => {
    expect(validateBDPhone("02712345678")).toBe(false); // Doesn't start with 01
    expect(validateBDPhone("0171234567")).toBe(false); // Too short
    expect(validateBDPhone("017123456789")).toBe(false); // Too long
  });
});
