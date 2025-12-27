import { z } from "zod";
import {
  VEHICLE_TYPES,
  BOOKING_STATUS,
  VALIDATION,
} from "@/lib/utils/constants";

// ==================== BOOKING VALIDATION SCHEMAS ====================

/**
 * Coordinates Schema
 * Validates latitude and longitude as numbers
 */
const coordinatesSchema = z.object({
  latitude: z
    .number({
      required_error: "অক্ষাংশ প্রয়োজন",
      invalid_type_error: "অক্ষাংশ অবশ্যই একটি সংখ্যা হতে হবে",
    })
    .min(-90, "অবৈধ অক্ষাংশ")
    .max(90, "অবৈধ অক্ষাংশ"),

  longitude: z
    .number({
      required_error: "দ্রাঘিমাংশ প্রয়োজন",
      invalid_type_error: "দ্রাঘিমাংশ অবশ্যই একটি সংখ্যা হতে হবে",
    })
    .min(-180, "অবৈধ দ্রাঘিমাংশ")
    .max(180, "অবৈধ দ্রাঘিমাংশ"),
});

/**
 * Booking Creation Schema
 * Validates booking creation data
 */
export const bookingCreateSchema = z
  .object({
    user: z.string({
      required_error: "ব্যবহারকারী ID প্রয়োজন",
    }),

    vehicleType: z.enum(
      [
        VEHICLE_TYPES.CAR,
        VEHICLE_TYPES.BIKE,
        VEHICLE_TYPES.TRUCK,
        VEHICLE_TYPES.VAN,
        VEHICLE_TYPES.BUS,
        VEHICLE_TYPES.CNG,
        VEHICLE_TYPES.RICKSHAW,
      ],
      {
        required_error: "গাড়ির ধরন নির্বাচন করুন",
        invalid_type_error: "অবৈধ গাড়ির ধরন",
      }
    ),

    problemDescription: z
      .string({
        required_error: "সমস্যার বিবরণ প্রয়োজন",
      })
      .min(
        VALIDATION.DESCRIPTION_MIN_LENGTH,
        `সমস্যার বিবরণ কমপক্ষে ${VALIDATION.DESCRIPTION_MIN_LENGTH} অক্ষরের হতে হবে`
      )
      .max(
        VALIDATION.DESCRIPTION_MAX_LENGTH,
        `সমস্যার বিবরণ সর্বোচ্চ ${VALIDATION.DESCRIPTION_MAX_LENGTH} অক্ষরের হতে পারে`
      )
      .trim(),

    // Location can be provided as coordinates or GeoJSON
    location: z
      .object({
        type: z.literal("Point"),
        coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
      })
      .optional(),

    // Or separate latitude/longitude
    latitude: z
      .number({
        invalid_type_error: "অক্ষাংশ অবশ্যই একটি সংখ্যা হতে হবে",
      })
      .min(-90, "অবৈধ অক্ষাংশ")
      .max(90, "অবৈধ অক্ষাংশ")
      .optional(),

    longitude: z
      .number({
        invalid_type_error: "দ্রাঘিমাংশ অবশ্যই একটি সংখ্যা হতে হবে",
      })
      .min(-180, "অবৈধ দ্রাঘিমাংশ")
      .max(180, "অবৈধ দ্রাঘিমাংশ")
      .optional(),

    address: z.string().optional(),

    phoneNumber: z
      .string()
      .regex(VALIDATION.PHONE_REGEX, VALIDATION.PHONE_ERROR_MESSAGE)
      .optional(),

    garage: z.string().optional(), // Garage ID (optional, can be auto-assigned)

    service: z.string().optional(), // Service ID

    scheduledDate: z.string().datetime().optional(),

    estimatedTime: z.string().optional(),
  })
  .refine(
    (data) => {
      // Either location OR (latitude AND longitude) must be provided
      return (
        data.location ||
        (data.latitude !== undefined && data.longitude !== undefined)
      );
    },
    {
      message: "অবস্থান প্রয়োজন (location অথবা latitude/longitude)",
      path: ["location"],
    }
  );

/**
 * Booking Update Schema
 * Validates booking status updates
 */
export const bookingUpdateSchema = z.object({
  status: z
    .enum([
      BOOKING_STATUS.PENDING,
      BOOKING_STATUS.ACCEPTED,
      BOOKING_STATUS.MECHANIC_ASSIGNED,
      BOOKING_STATUS.DIAGNOSIS_SUBMITTED,
      BOOKING_STATUS.ESTIMATE_SENT,
      BOOKING_STATUS.ESTIMATE_CONFIRMED,
      BOOKING_STATUS.IN_PROGRESS,
      BOOKING_STATUS.PAYMENT_PENDING,
      BOOKING_STATUS.PAYMENT_SUBMITTED,
      BOOKING_STATUS.PAYMENT_APPROVED,
      BOOKING_STATUS.COMPLETED,
      BOOKING_STATUS.CANCELLED,
      BOOKING_STATUS.REJECTED,
    ])
    .optional(),

  garage: z.string().optional(),

  estimatedTime: z.string().optional(),

  completionNote: z.string().max(VALIDATION.DESCRIPTION_MAX_LENGTH).optional(),

  // For mechanic assignment
  assignedMechanic: z.string().optional(),

  // For payment
  isPaymentSubmitted: z.boolean().optional(),
  isPaymentApproved: z.boolean().optional(),
  paymentDetails: z
    .object({
      method: z.string().optional(),
      transactionId: z.string().optional(),
      amount: z.number().optional(),
      screenshot: z.string().optional(),
    })
    .optional(),
});

/**
 * Pagination Schema
 * Validates pagination parameters
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive().default(1)),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive().max(100).default(10)),

  sort: z.string().optional().default("-createdAt"),
});

/**
 * Booking Filter Schema
 * Validates booking filter parameters
 */
export const bookingFilterSchema = z.object({
  status: z
    .enum([
      BOOKING_STATUS.PENDING,
      BOOKING_STATUS.ACCEPTED,
      BOOKING_STATUS.MECHANIC_ASSIGNED,
      BOOKING_STATUS.DIAGNOSIS_SUBMITTED,
      BOOKING_STATUS.ESTIMATE_SENT,
      BOOKING_STATUS.ESTIMATE_CONFIRMED,
      BOOKING_STATUS.IN_PROGRESS,
      BOOKING_STATUS.PAYMENT_PENDING,
      BOOKING_STATUS.PAYMENT_SUBMITTED,
      BOOKING_STATUS.PAYMENT_APPROVED,
      BOOKING_STATUS.COMPLETED,
      BOOKING_STATUS.CANCELLED,
      BOOKING_STATUS.REJECTED,
    ])
    .optional(),

  vehicleType: z
    .enum([
      VEHICLE_TYPES.CAR,
      VEHICLE_TYPES.BIKE,
      VEHICLE_TYPES.TRUCK,
      VEHICLE_TYPES.VAN,
      VEHICLE_TYPES.BUS,
      VEHICLE_TYPES.CNG,
      VEHICLE_TYPES.RICKSHAW,
    ])
    .optional(),

  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),

  userId: z.string().optional(),
  garageId: z.string().optional(),
});

// Export all booking schemas
export const bookingSchemas = {
  create: bookingCreateSchema,
  update: bookingUpdateSchema,
  pagination: paginationSchema,
  filter: bookingFilterSchema,
};
