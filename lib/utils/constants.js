// ============================================
// CONSTANTS - Centralized Configuration
// ============================================

// ==================== ROLES & PERMISSIONS ====================
export const ROLES = {
  USER: "user",
  ADMIN: "admin",
  GARAGE: "garage",
  MECHANIC: "mechanic",
};

export const PERMISSIONS = {
  [ROLES.ADMIN]: ["*"], // Admin has all permissions
  [ROLES.GARAGE]: [
    "bookings:read",
    "bookings:update",
    "garage:update",
    "team:manage",
  ],
  [ROLES.MECHANIC]: ["bookings:read", "bookings:update"],
  [ROLES.USER]: ["bookings:create", "bookings:read", "profile:update"],
};

// ==================== AUTHENTICATION ====================
export const AUTH = {
  JWT_EXPIRY: "7d", // 7 days
  COOKIE_NAME: "token",
  COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/, // At least 1 lowercase, 1 uppercase, 1 number
};

// ==================== VALIDATION RULES ====================
export const VALIDATION = {
  // Bangladesh phone number format: 01XXXXXXXXX (11 digits starting with 01)
  PHONE_REGEX: /^01[0-9]{9}$/,
  PHONE_ERROR_MESSAGE:
    "ফোন নম্বর অবশ্যই 01 দিয়ে শুরু হবে এবং ১১ সংখ্যার হতে হবে",

  EMAIL_ERROR_MESSAGE: "সঠিক ইমেইল ঠিকানা প্রদান করুন",
  PASSWORD_ERROR_MESSAGE:
    "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে এবং একটি বড় হাতের অক্ষর, একটি ছোট হাতের অক্ষর এবং একটি সংখ্যা থাকতে হবে",

  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 1000,
};

// ==================== BUSINESS LOGIC ====================
export const BUSINESS = {
  // Geospatial search radius in meters (20km)
  SEARCH_RADIUS_METERS: 20000,

  // Default address for Bangladesh
  DEFAULT_ADDRESS: {
    street: "",
    city: "Dhaka",
    district: "Dhaka",
    postalCode: "",
  },

  // Default coordinates for Dhaka, Bangladesh
  DEFAULT_COORDINATES: {
    latitude: 23.8103,
    longitude: 90.4125,
  },

  // Rejection fee in BDT
  REJECTION_FEE: 150,

  // Maximum distance for garage assignment (in meters)
  MAX_GARAGE_DISTANCE: 50000, // 50km
};

// ==================== VEHICLE TYPES ====================
export const VEHICLE_TYPES = {
  CAR: "car",
  BIKE: "bike",
  TRUCK: "truck",
  VAN: "van",
  BUS: "bus",
  CNG: "cng",
  RICKSHAW: "rickshaw",
};

export const VEHICLE_TYPE_LABELS = {
  [VEHICLE_TYPES.CAR]: "গাড়ি",
  [VEHICLE_TYPES.BIKE]: "বাইক",
  [VEHICLE_TYPES.TRUCK]: "ট্রাক",
  [VEHICLE_TYPES.VAN]: "ভ্যান",
  [VEHICLE_TYPES.BUS]: "বাস",
  [VEHICLE_TYPES.CNG]: "সিএনজি",
  [VEHICLE_TYPES.RICKSHAW]: "রিকশা",
};

// ==================== BOOKING STATUS ====================
export const BOOKING_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  MECHANIC_ASSIGNED: "mechanic_assigned",
  DIAGNOSIS_SUBMITTED: "diagnosis_submitted",
  ESTIMATE_SENT: "estimate_sent",
  ESTIMATE_CONFIRMED: "estimate_confirmed",
  IN_PROGRESS: "in_progress",
  PAYMENT_PENDING: "payment_pending",
  PAYMENT_SUBMITTED: "payment_submitted",
  PAYMENT_APPROVED: "payment_approved",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
};

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: "অপেক্ষমান",
  [BOOKING_STATUS.ACCEPTED]: "গৃহীত",
  [BOOKING_STATUS.MECHANIC_ASSIGNED]: "মেকানিক নিয়োগ করা হয়েছে",
  [BOOKING_STATUS.DIAGNOSIS_SUBMITTED]: "রোগ নির্ণয় জমা দেওয়া হয়েছে",
  [BOOKING_STATUS.ESTIMATE_SENT]: "আনুমানিক খরচ পাঠানো হয়েছে",
  [BOOKING_STATUS.ESTIMATE_CONFIRMED]: "আনুমানিক খরচ নিশ্চিত করা হয়েছে",
  [BOOKING_STATUS.IN_PROGRESS]: "চলমান",
  [BOOKING_STATUS.PAYMENT_PENDING]: "পেমেন্ট অপেক্ষমান",
  [BOOKING_STATUS.PAYMENT_SUBMITTED]: "পেমেন্ট জমা দেওয়া হয়েছে",
  [BOOKING_STATUS.PAYMENT_APPROVED]: "পেমেন্ট অনুমোদিত",
  [BOOKING_STATUS.COMPLETED]: "সম্পন্ন",
  [BOOKING_STATUS.CANCELLED]: "বাতিল",
  [BOOKING_STATUS.REJECTED]: "প্রত্যাখ্যাত",
};

// ==================== PAYMENT STATUS ====================
export const PAYMENT_STATUS = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  FAILED: "failed",
  REFUNDED: "refunded",
};

export const PAYMENT_METHODS = {
  CASH: "cash",
  BKASH: "bkash",
  NAGAD: "nagad",
  ROCKET: "rocket",
  SSLCOMMERZ: "sslcommerz",
  CARD: "card",
};

// ==================== NOTIFICATION TYPES ====================
export const NOTIFICATION_TYPES = {
  BOOKING_NEW: "booking_new",
  BOOKING_ACCEPTED: "booking_accepted",
  BOOKING_REJECTED: "booking_rejected",
  BOOKING_COMPLETED: "booking_completed",
  BOOKING_CANCELLED: "booking_cancelled",
  MECHANIC_ASSIGNED: "mechanic_assigned",
  ESTIMATE_SENT: "estimate_sent",
  ESTIMATE_CONFIRMED: "estimate_confirmed",
  PAYMENT_RECEIVED: "payment_received",
  PAYMENT_APPROVED: "payment_approved",
  SYSTEM: "system",
};

// ==================== PAGINATION ====================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// ==================== HTTP STATUS CODES ====================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

// ==================== API RESPONSE MESSAGES ====================
export const MESSAGES = {
  // Success Messages
  SUCCESS: {
    SIGNUP: "নিবন্ধন সফল হয়েছে। অনুগ্রহ করে লগইন করুন।",
    LOGIN: "লগইন সফল হয়েছে।",
    LOGOUT: "লগআউট সফল হয়েছে।",
    BOOKING_CREATED: "বুকিং সফলভাবে তৈরি হয়েছে।",
    BOOKING_UPDATED: "বুকিং আপডেট হয়েছে।",
    BOOKING_CANCELLED: "বুকিং বাতিল হয়েছে।",
    GARAGE_CREATED: "গ্যারেজ নিবন্ধন সফল হয়েছে।",
    GARAGE_UPDATED: "গ্যারেজ আপডেট হয়েছে।",
    PROFILE_UPDATED: "প্রোফাইল আপডেট হয়েছে।",
    PASSWORD_CHANGED: "পাসওয়ার্ড পরিবর্তন হয়েছে।",
    DELETED: "মুছে ফেলা হয়েছে।",
  },

  // Error Messages
  ERROR: {
    REQUIRED_FIELDS: "সমস্ত প্রয়োজনীয় ক্ষেত্র পূরণ করুন।",
    INVALID_CREDENTIALS: "ইমেইল বা পাসওয়ার্ড ভুল।",
    EMAIL_EXISTS: "এই ইমেইল ইতিমধ্যে নিবন্ধিত। অনুগ্রহ করে লগইন করুন।",
    USER_NOT_FOUND: "ব্যবহারকারী খুঁজে পাওয়া যায়নি।",
    GARAGE_NOT_FOUND: "গ্যারেজ খুঁজে পাওয়া যায়নি।",
    BOOKING_NOT_FOUND: "বুকিং খুঁজে পাওয়া যায়নি।",
    NO_NEARBY_GARAGES: "আপনার আশেপাশে কোন গ্যারেজ পাওয়া যায়নি।",
    UNAUTHORIZED: "অননুমোদিত প্রবেশ।",
    FORBIDDEN: "আপনার এই কাজ করার অনুমতি নেই।",
    INVALID_TOKEN: "অবৈধ টোকেন।",
    TOKEN_EXPIRED: "টোকেনের মেয়াদ শেষ হয়েছে।",
    INTERNAL_SERVER: "সার্ভার ত্রুটি। পরে আবার চেষ্টা করুন।",
    VALIDATION_FAILED: "ডেটা যাচাইকরণ ব্যর্থ হয়েছে।",
    INVALID_COORDINATES: "অবৈধ স্থানাঙ্ক।",
    WEAK_PASSWORD: "পাসওয়ার্ড দুর্বল। শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।",
  },
};

// ==================== SERVICE TYPES ====================
export const SERVICE_TYPES = {
  TOWING: "towing",
  REPAIR: "repair",
  MAINTENANCE: "maintenance",
  INSPECTION: "inspection",
  EMERGENCY: "emergency",
  DIAGNOSIS: "diagnosis",
};

// ==================== MEMBERSHIP TIERS ====================
export const MEMBERSHIP_TIERS = {
  FREE: "free",
  BASIC: "basic",
  PREMIUM: "premium",
  ENTERPRISE: "enterprise",
};

// ==================== ENTERPRISE ROLES ====================
export const ENTERPRISE_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
};

// ==================== FILE UPLOAD ====================
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf", "image/jpeg", "image/png"],
};

// ==================== RATE LIMITING ====================
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100, // Max 100 requests per window
  AUTH_MAX_REQUESTS: 5, // Max 5 login/signup attempts per window
};

// ==================== DATABASE ====================
export const DATABASE = {
  CONNECTION_OPTIONS: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  MAX_POOL_SIZE: 10,
  MIN_POOL_SIZE: 2,
};

// ==================== PUBLIC ROUTES ====================
export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/about",
  "/contact",
  "/services",
  "/api/auth/login",
  "/api/auth/signup",
];

// ==================== PROTECTED ROUTE PATTERNS ====================
export const PROTECTED_ROUTES = {
  ADMIN: ["/admin", "/api/admin"],
  GARAGE: ["/garage", "/api/garages/my"],
  USER: ["/user", "/api/bookings/my"],
};

export default {
  ROLES,
  PERMISSIONS,
  AUTH,
  VALIDATION,
  BUSINESS,
  VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
  BOOKING_STATUS,
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  NOTIFICATION_TYPES,
  PAGINATION,
  HTTP_STATUS,
  MESSAGES,
  SERVICE_TYPES,
  MEMBERSHIP_TIERS,
  ENTERPRISE_ROLES,
  FILE_UPLOAD,
  RATE_LIMIT,
  DATABASE,
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
};
