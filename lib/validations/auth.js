import { z } from "zod";
import { VALIDATION, ROLES } from "@/lib/utils/constants";

// ==================== AUTH VALIDATION SCHEMAS ====================

/**
 * Login Schema
 * Validates email and password for login
 */
export const loginSchema = z.object({
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
    .min(1, "পাসওয়ার্ড প্রয়োজন"),
});

/**
 * Signup Schema
 * Validates user registration data
 */
export const signupSchema = z.object({
  name: z
    .string({
      required_error: "নাম প্রয়োজন",
    })
    .min(
      VALIDATION.NAME_MIN_LENGTH,
      `নাম কমপক্ষে ${VALIDATION.NAME_MIN_LENGTH} অক্ষরের হতে হবে`
    )
    .max(
      VALIDATION.NAME_MAX_LENGTH,
      `নাম সর্বোচ্চ ${VALIDATION.NAME_MAX_LENGTH} অক্ষরের হতে পারে`
    )
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
    .string()
    .regex(VALIDATION.PHONE_REGEX, VALIDATION.PHONE_ERROR_MESSAGE)
    .optional()
    .or(z.literal("")),

  role: z
    .enum([ROLES.USER, ROLES.GARAGE, ROLES.ADMIN])
    .default(ROLES.USER)
    .optional(),

  // For garage registration
  garageName: z.string().optional(),

  address: z
    .union([
      z.string(),
      z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        district: z.string().optional(),
        postalCode: z.string().optional(),
      }),
    ])
    .optional(),
});

/**
 * Profile Update Schema
 */
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(
      VALIDATION.NAME_MIN_LENGTH,
      `নাম কমপক্ষে ${VALIDATION.NAME_MIN_LENGTH} অক্ষরের হতে হবে`
    )
    .max(VALIDATION.NAME_MAX_LENGTH)
    .trim()
    .optional(),

  phone: z
    .string()
    .regex(VALIDATION.PHONE_REGEX, VALIDATION.PHONE_ERROR_MESSAGE)
    .optional(),

  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),

  avatar: z.string().url("অবৈধ URL").optional(),
});

/**
 * Password Change Schema
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string({
      required_error: "বর্তমান পাসওয়ার্ড প্রয়োজন",
    }),

    newPassword: z
      .string({
        required_error: "নতুন পাসওয়ার্ড প্রয়োজন",
      })
      .min(6, VALIDATION.PASSWORD_ERROR_MESSAGE)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        VALIDATION.PASSWORD_ERROR_MESSAGE
      ),

    confirmPassword: z.string({
      required_error: "পাসওয়ার্ড নিশ্চিত করুন",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "পাসওয়ার্ড মিলছে না",
    path: ["confirmPassword"],
  });

// Export all auth schemas
export const authSchemas = {
  login: loginSchema,
  signup: signupSchema,
  profileUpdate: profileUpdateSchema,
  passwordChange: passwordChangeSchema,
};
