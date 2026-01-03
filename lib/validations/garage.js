import { z } from "zod";
import { VALIDATION, SERVICE_TYPES } from "@/lib/utils/constants";

// ==================== GARAGE VALIDATION SCHEMAS ====================

/**
 * GeoJSON Location Schema
 * Validates GeoJSON Point format for garage location
 */
const geoJSONSchema = z.object({
  type: z.literal("Point", {
    required_error: 'অবস্থানের ধরন "Point" হতে হবে',
  }),
  coordinates: z
    .tuple([z.number(), z.number()], {
      required_error: "স্থানাঙ্ক প্রয়োজন [দ্রাঘিমাংশ, অক্ষাংশ]",
      invalid_type_error: "স্থানাঙ্ক অবশ্যই সংখ্যা হতে হবে",
    })
    .refine(
      ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
      "অবৈধ স্থানাঙ্ক মান"
    ),
});

/**
 * Working Hours Schema
 */
const workingHoursSchema = z.object({
  open: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "সময় ফরম্যাট HH:MM হতে হবে")
    .optional(),
  close: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "সময় ফরম্যাট HH:MM হতে হবে")
    .optional(),
});

/**
 * Garage Registration Schema
 * Validates garage registration data
 */
export const garageRegistrationSchema = z
  .object({
    name: z
      .string({
        required_error: "গ্যারেজের নাম প্রয়োজন",
      })
      .min(
        VALIDATION.NAME_MIN_LENGTH,
        `নাম কমপক্ষে ${VALIDATION.NAME_MIN_LENGTH} অক্ষরের হতে হবে`
      )
      .max(VALIDATION.NAME_MAX_LENGTH)
      .trim(),

    email: z
      .string({
        required_error: "ইমেইল প্রয়োজন",
      })
      .email(VALIDATION.EMAIL_ERROR_MESSAGE)
      .toLowerCase()
      .trim(),

    password: z
      .string({
        required_error: "পাসওয়ার্ড প্রয়োজন",
      })
      .min(6, VALIDATION.PASSWORD_ERROR_MESSAGE)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        VALIDATION.PASSWORD_ERROR_MESSAGE
      ),

    phone: z
      .string({
        required_error: "ফোন নম্বর প্রয়োজন",
      })
      .regex(VALIDATION.PHONE_REGEX, VALIDATION.PHONE_ERROR_MESSAGE),

    address: z.union([
      z.string().min(5, "ঠিকানা কমপক্ষে ৫ অক্ষরের হতে হবে"),
      z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        district: z.string().optional(),
        postalCode: z.string().optional(),
      }),
    ]),

    // Location in GeoJSON format
    location: geoJSONSchema.optional(),

    // Or separate latitude/longitude (will be converted to GeoJSON)
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

    services: z
      .array(z.string(), {
        required_error: "কমপক্ষে একটি সেবা নির্বাচন করুন",
      })
      .min(1, "কমপক্ষে একটি সেবা নির্বাচন করুন"),

    tradeLicense: z.string().optional(),

    description: z.string().max(VALIDATION.DESCRIPTION_MAX_LENGTH).optional(),

    workingHours: workingHoursSchema.optional(),

    owner: z.string().optional(), // User ID
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
 * Garage Update Schema
 * Validates garage profile updates
 */
export const garageUpdateSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.NAME_MIN_LENGTH)
    .max(VALIDATION.NAME_MAX_LENGTH)
    .trim()
    .optional(),

  phone: z
    .string()
    .regex(VALIDATION.PHONE_REGEX, VALIDATION.PHONE_ERROR_MESSAGE)
    .optional(),

  address: z
    .union([
      z.string().min(5),
      z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        district: z.string().optional(),
        postalCode: z.string().optional(),
      }),
    ])
    .optional(),

  location: geoJSONSchema.optional(),

  services: z
    .array(z.string())
    .min(1, "কমপক্ষে একটি সেবা নির্বাচন করুন")
    .optional(),

  tradeLicense: z.string().optional(),

  description: z.string().max(VALIDATION.DESCRIPTION_MAX_LENGTH).optional(),

  workingHours: workingHoursSchema.optional(),

  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Garage Search Schema
 * Validates nearby garage search parameters
 */
export const garageSearchSchema = z.object({
  latitude: z.coerce
    .number({
      required_error: "অক্ষাংশ প্রয়োজন",
      invalid_type_error: "অক্ষাংশ অবশ্যই একটি সংখ্যা হতে হবে",
    })
    .min(-90, "অবৈধ অক্ষাংশ")
    .max(90, "অবৈধ অক্ষাংশ"),

  longitude: z.coerce
    .number({
      required_error: "দ্রাঘিমাংশ প্রয়োজন",
      invalid_type_error: "দ্রাঘিমাংশ অবশ্যই একটি সংখ্যা হতে হবে",
    })
    .min(-180, "অবৈধ দ্রাঘিমাংশ")
    .max(180, "অবৈধ দ্রাঘিমাংশ"),

  radius: z.coerce
    .number()
    .int()
    .positive()
    .max(100000, "সর্বোচ্চ ১০০ কিমি")
    .optional(),

  services: z.string().optional(), // Comma-separated service IDs

  verified: z.coerce.boolean().optional(),
});

/**
 * Garage Filter Schema
 * Validates garage listing filter parameters
 */
export const garageFilterSchema = z.object({
  verified: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .pipe(z.boolean().optional()),

  active: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .pipe(z.boolean().optional()),

  services: z.string().optional(), // Comma-separated service names

  city: z.string().optional(),
  district: z.string().optional(),
});

// Export all garage schemas
export const garageSchemas = {
  registration: garageRegistrationSchema,
  update: garageUpdateSchema,
  search: garageSearchSchema,
  filter: garageFilterSchema,
};
