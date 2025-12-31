/**
 * OTP Utility Functions for Booking Verification
 * Generates and validates OTPs for service start and completion
 */

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate OTP data with expiration
 * @param {number} expiryMinutes - OTP validity in minutes (default: 10)
 * @returns {object} OTP data object
 */
export function generateOTPData(expiryMinutes = 10) {
  const code = generateOTP();
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + expiryMinutes * 60000);

  return {
    code,
    generatedAt,
    expiresAt,
    verified: false,
    verifiedAt: null,
    attempts: 0,
  };
}

/**
 * Verify OTP code
 * @param {object} otpData - OTP data from database
 * @param {string} inputCode - User input OTP
 * @returns {object} Verification result
 */
export function verifyOTP(otpData, inputCode) {
  // Check if OTP exists
  if (!otpData || !otpData.code) {
    return {
      success: false,
      message: "OTP not generated",
    };
  }

  // Check if already verified
  if (otpData.verified) {
    return {
      success: false,
      message: "OTP already verified",
    };
  }

  // Check if expired
  if (new Date() > new Date(otpData.expiresAt)) {
    return {
      success: false,
      message: "OTP expired. Please request a new one",
    };
  }

  // Check max attempts (prevent brute force)
  if (otpData.attempts >= 5) {
    return {
      success: false,
      message: "Maximum attempts exceeded. Please request a new OTP",
    };
  }

  // Verify code
  if (otpData.code !== inputCode.toString()) {
    return {
      success: false,
      message: "Invalid OTP code",
      incrementAttempts: true,
    };
  }

  // Success
  return {
    success: true,
    message: "OTP verified successfully",
  };
}

/**
 * Check if OTP is still valid (not expired)
 * @param {object} otpData - OTP data from database
 * @returns {boolean}
 */
export function isOTPValid(otpData) {
  if (!otpData || !otpData.code || otpData.verified) {
    return false;
  }
  return new Date() <= new Date(otpData.expiresAt);
}
