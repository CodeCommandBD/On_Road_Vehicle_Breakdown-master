/**
 * Multilingual error messages for the application
 * Supports English (en) and Bangla (bn)
 */

const errorMessages = {
  en: {
    // Authentication errors
    emailExists: "This email is already registered. Please login.",
    invalidCredentials: "Invalid email or password.",
    userNotFound: "User not found.",
    unauthorized: "You are not authorized to perform this action.",
    sessionExpired: "Your session has expired. Please login again.",

    // Validation errors
    invalidEmail: "Please enter a valid email address.",
    passwordTooShort: "Password must be at least 6 characters long.",
    passwordMismatch: "Passwords do not match.",
    requiredField: "This field is required.",
    invalidPhone: "Please enter a valid phone number.",

    // Server errors
    serverError: "Something went wrong. Please try again later.",
    databaseError: "Database error occurred. Please try again.",
    networkError: "Network error. Please check your connection.",

    // Resource errors
    notFound: "The requested resource was not found.",
    alreadyExists: "This resource already exists.",

    // Generic errors
    unknownError: "An unknown error occurred.",
  },

  bn: {
    // Authentication errors
    emailExists: "এই ইমেইলটি ইতিমধ্যে নিবন্ধিত। অনুগ্রহ করে লগইন করুন।",
    invalidCredentials: "ভুল ইমেইল বা পাসওয়ার্ড।",
    userNotFound: "ব্যবহারকারী পাওয়া যায়নি।",
    unauthorized: "আপনি এই কাজটি করার জন্য অনুমোদিত নন।",
    sessionExpired:
      "আপনার সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।",

    // Validation errors
    invalidEmail: "অনুগ্রহ করে একটি বৈধ ইমেইল ঠিকানা লিখুন।",
    passwordTooShort: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।",
    passwordMismatch: "পাসওয়ার্ড মিলছে না।",
    requiredField: "এই ক্ষেত্রটি আবশ্যক।",
    invalidPhone: "অনুগ্রহ করে একটি বৈধ ফোন নম্বর লিখুন।",

    // Server errors
    serverError: "কিছু ভুল হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
    databaseError: "ডেটাবেস ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    networkError: "নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে আপনার সংযোগ পরীক্ষা করুন।",

    // Resource errors
    notFound: "অনুরোধকৃত সম্পদ পাওয়া যায়নি।",
    alreadyExists: "এই সম্পদটি ইতিমধ্যে বিদ্যমান।",

    // Generic errors
    unknownError: "একটি অজানা ত্রুটি ঘটেছে।",
  },
};

/**
 * Get translated error message
 * @param {string} locale - Language code (en or bn)
 * @param {string} key - Message key
 * @param {string} fallback - Fallback message if key not found
 * @returns {string} Translated message
 */
export function getTranslatedMessage(locale = "en", key, fallback = null) {
  const lang = locale === "bn" ? "bn" : "en"; // Default to English if locale is invalid

  if (errorMessages[lang] && errorMessages[lang][key]) {
    return errorMessages[lang][key];
  }

  // Fallback to English if Bangla translation not found
  if (lang === "bn" && errorMessages.en[key]) {
    return errorMessages.en[key];
  }

  // Return fallback or the key itself
  return fallback || key;
}

export default errorMessages;
