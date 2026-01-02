import { vi } from "vitest";

/**
 * Mock MongoDB connection
 */
export const mockConnectDB = vi.fn().mockResolvedValue(true);

/**
 * Mock user data for tests
 */
export const mockUser = {
  _id: "507f1f77bcf86cd799439011",
  email: "test@example.com",
  name: "Test User",
  role: "user",
  isActive: true,
  membershipTier: "free",
  toPublicJSON: function () {
    return {
      id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
    };
  },
};

export const mockAdmin = {
  _id: "507f1f77bcf86cd799439012",
  email: "admin@example.com",
  name: "Admin User",
  role: "admin",
  isActive: true,
  membershipTier: "enterprise",
  toPublicJSON: function () {
    return {
      id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
    };
  },
};

export const mockGarage = {
  _id: "507f1f77bcf86cd799439013",
  email: "garage@example.com",
  name: "Test Garage",
  role: "garage",
  isActive: true,
  membershipTier: "premium",
  toPublicJSON: function () {
    return {
      id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
    };
  },
};

/**
 * Mock booking data
 */
export const mockBooking = {
  _id: "507f1f77bcf86cd799439020",
  bookingNumber: "BK-2026-0001",
  user: mockUser._id,
  garage: mockGarage._id,
  service: "Oil Change",
  status: "pending",
  scheduledDate: new Date("2026-01-15"),
  totalAmount: 2500,
  createdAt: new Date(),
};

/**
 * Create mock request object
 */
export function createMockRequest(options = {}) {
  const {
    method = "GET",
    body = null,
    headers = {},
    cookies = {},
    url = "http://localhost:3000/api/test",
  } = options;

  return {
    method,
    headers: new Headers(headers),
    json: async () => body,
    text: async () => JSON.stringify(body),
    url,
    cookies: {
      get: (name) => (cookies[name] ? { value: cookies[name] } : undefined),
      set: vi.fn(),
      delete: vi.fn(),
    },
  };
}

/**
 * Create mock NextResponse
 */
export function createMockResponse(data, status = 200) {
  return {
    status,
    data,
    json: async () => data,
    ok: status >= 200 && status < 300,
  };
}

/**
 * Wait for async operations
 */
export const waitFor = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock environment variables
 */
export function mockEnv(vars = {}) {
  const original = { ...process.env };

  Object.keys(vars).forEach((key) => {
    process.env[key] = vars[key];
  });

  return () => {
    // Restore original env
    Object.keys(vars).forEach((key) => {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    });
  };
}
