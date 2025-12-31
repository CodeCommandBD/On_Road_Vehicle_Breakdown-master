import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables
process.env.MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key";
process.env.EMAIL_USER = process.env.EMAIL_USER || "test@example.com";
process.env.EMAIL_PASS = process.env.EMAIL_PASS || "test-password";
process.env.NEXT_PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Mock fetch globally
global.fetch = vi.fn();

// Mock window.matchMedia (for responsive components)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
