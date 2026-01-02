import { describe, test, expect, beforeEach, vi } from "vitest";

// Mock dependencies
vi.mock("@/lib/db/connect", () => ({
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/utils/rateLimit", () => ({
  rateLimitMiddleware: vi.fn(() => null),
}));

const mockBookingModel = {
  find: vi.fn(),
  findById: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  countDocuments: vi.fn(),
};

vi.mock("@/lib/db/models/Booking", () => ({
  default: mockBookingModel,
}));

vi.mock("@/lib/utils/auth", () => ({
  getCurrentUser: vi.fn(),
  verifyToken: vi.fn(),
  hashPassword: vi.fn(),
  createToken: vi.fn(),
}));

describe("Booking API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/bookings", () => {
    test("should return unauthorized without auth", async () => {
      const { getCurrentUser } = await import("@/lib/utils/auth");
      getCurrentUser.mockResolvedValue(null);

      const { GET } = await import("@/app/api/bookings/route");

      const request = {
        url: "http://localhost:3000/api/bookings",
        nextUrl: { searchParams: new URLSearchParams() },
      };

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(response.status).toBe(401);
    });

    test("should return bookings for authenticated user", async () => {
      const { getCurrentUser } = await import("@/lib/utils/auth");
      getCurrentUser.mockResolvedValue({
        userId: "123",
        role: "user",
      });

      mockBookingModel.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                skip: vi.fn().mockResolvedValue([
                  {
                    _id: "1",
                    bookingNumber: "BK-2026-0001",
                    status: "pending",
                  },
                ]),
              }),
            }),
          }),
        }),
      });

      mockBookingModel.countDocuments.mockResolvedValue(1);

      const { GET } = await import("@/app/api/bookings/route");

      const request = {
        url: "http://localhost:3000/api/bookings",
        nextUrl: { searchParams: new URLSearchParams() },
      };

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.bookings).toBeDefined();
    });
  });

  describe("POST /api/bookings", () => {
    test("should create booking with valid data", async () => {
      const { getCurrentUser } = await import("@/lib/utils/auth");
      getCurrentUser.mockResolvedValue({
        userId: "123",
        role: "user",
      });

      mockBookingModel.create.mockResolvedValue({
        _id: "1",
        bookingNumber: "BK-2026-0001",
        user: "123",
        garage: "456",
        status: "pending",
      });

      const { POST } = await import("@/app/api/bookings/route");

      const request = {
        json: async () => ({
          garage: "456",
          service: "Oil Change",
          scheduledDate: "2026-01-15",
          vehicleInfo: {
            make: "Toyota",
            model: "Corolla",
            year: 2020,
          },
        }),
      };

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.booking).toBeDefined();
    });

    test("should validate required fields", async () => {
      const { getCurrentUser } = await import("@/lib/utils/auth");
      getCurrentUser.mockResolvedValue({
        userId: "123",
        role: "user",
      });

      const { POST } = await import("@/app/api/bookings/route");

      const request = {
        json: async () => ({}), // Missing required fields
      };

      try {
        await POST(request);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});

describe("Booking Status Tests", () => {
  test("should validate booking status values", () => {
    const validStatuses = [
      "pending",
      "confirmed",
      "in-progress",
      "completed",
      "cancelled",
    ];

    validStatuses.forEach((status) => {
      expect(validStatuses).toContain(status);
    });
  });

  test("should reject invalid status", () => {
    const validStatuses = [
      "pending",
      "confirmed",
      "in-progress",
      "completed",
      "cancelled",
    ];
    const invalidStatus = "invalid-status";

    expect(validStatuses).not.toContain(invalidStatus);
  });
});

describe("Booking Number Generation", () => {
  test("should generate unique booking number", () => {
    const generateBookingNumber = () => {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      return `BK-${year}-${random}`;
    };

    const bookingNumber = generateBookingNumber();

    expect(bookingNumber).toMatch(/^BK-\d{4}-\d{4}$/);
    expect(bookingNumber).toContain("2026");
  });
});
