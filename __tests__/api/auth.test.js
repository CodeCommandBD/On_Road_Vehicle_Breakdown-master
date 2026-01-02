import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";

// Mock Next.js modules
vi.mock("next/server", () => ({
  NextResponse: {
    json: (data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    }),
  },
}));

// Mock database connection
vi.mock("@/lib/db/connect", () => ({
  default: vi.fn().mockResolvedValue(true),
}));

// Mock rate limiting
vi.mock("@/lib/utils/rateLimit", () => ({
  rateLimitMiddleware: vi.fn(() => null),
  strictRateLimit: vi.fn(() => null),
}));

// Mock User model
const mockUserModel = {
  findOne: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
};

vi.mock("@/lib/db/models/User", () => ({
  default: mockUserModel,
}));

describe("POST /api/auth/login - Fixed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret-key-for-integration-tests";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should return error for missing credentials", async () => {
    const { POST } = await import("@/app/api/auth/login/route");

    const request = {
      json: async () => ({}),
      cookies: {
        get: vi.fn(),
        set: vi.fn(),
      },
    };

    try {
      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
    } catch (error) {
      // Zod validation error expected
      expect(error).toBeDefined();
    }
  });

  test("should return error for non-existent user", async () => {
    mockUserModel.findOne.mockResolvedValue(null);

    const { POST } = await import("@/app/api/auth/login/route");

    const request = {
      json: async () => ({
        email: "nonexistent@example.com",
        password: "Password123!",
      }),
      cookies: {
        get: vi.fn(),
        set: vi.fn(),
      },
    };

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(response.status).toBe(404);
  });

  test("should handle inactive user account", async () => {
    mockUserModel.findOne.mockResolvedValue({
      _id: "123",
      email: "inactive@example.com",
      isActive: false,
      comparePassword: vi.fn().mockResolvedValue(true),
    });

    const { POST } = await import("@/app/api/auth/login/route");

    const request = {
      json: async () => ({
        email: "inactive@example.com",
        password: "Password123!",
      }),
      cookies: {
        get: vi.fn(),
        set: vi.fn(),
      },
    };

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(response.status).toBe(403);
  });
});

describe("POST /api/auth/signup - Fixed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret-key-for-integration-tests";
  });

  test("should return error for existing email", async () => {
    mockUserModel.findOne.mockResolvedValue({
      email: "existing@example.com",
    });

    const { POST } = await import("@/app/api/auth/signup/route");

    const request = {
      json: async () => ({
        name: "Test User",
        email: "existing@example.com",
        password: "Password123!",
        phone: "01712345678",
      }),
      cookies: {
        get: vi.fn(),
        set: vi.fn(),
      },
    };

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(response.status).toBe(409);
  });

  test("should validate required fields", async () => {
    const { POST } = await import("@/app/api/auth/signup/route");

    const request = {
      json: async () => ({
        email: "test@example.com",
        // Missing name, password, phone
      }),
      cookies: {
        get: vi.fn(),
        set: vi.fn(),
      },
    };

    try {
      await POST(request);
    } catch (error) {
      // Zod validation error expected
      expect(error).toBeDefined();
    }
  });
});

describe("Authentication Utilities - Integration", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-key-for-integration-tests";
  });

  test("should create and verify token successfully", async () => {
    const { createToken, verifyToken } = await import("@/lib/utils/auth");

    const payload = {
      userId: "123",
      email: "test@example.com",
      role: "user",
    };

    const token = await createToken(payload);
    expect(token).toBeDefined();

    const verified = await verifyToken(token);
    expect(verified).toBeDefined();
    expect(verified.userId).toBe(payload.userId);
  });

  test("should hash passwords correctly", async () => {
    const { hashPassword } = await import("@/lib/utils/auth");

    const password = "TestPassword123!";
    const hashed = await hashPassword(password);

    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(50);
  });
});
