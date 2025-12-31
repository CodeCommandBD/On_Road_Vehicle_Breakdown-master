/**
 * SMS Notification Utility
 * Sends SMS notifications via Twilio or Bulk SMS service
 */

/**
 * SMS Service Configuration
 * You can use either Twilio or any Bangladeshi Bulk SMS provider
 */
const SMS_CONFIG = {
  // Twilio Configuration (International)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,

  // Bulk SMS Configuration (Bangladesh)
  BULK_SMS_API_KEY: process.env.BULK_SMS_API_KEY,
  BULK_SMS_SENDER_ID: process.env.BULK_SMS_SENDER_ID || "VehicleSOS",
  BULK_SMS_API_URL:
    process.env.BULK_SMS_API_URL || "https://api.sms.net.bd/sendsms",
};

/**
 * Send SMS using Twilio
 * @param {string} to - Phone number (with country code)
 * @param {string} message - SMS message
 * @returns {Promise<object>} SMS result
 */
async function sendViaTwilio(to, message) {
  try {
    // Dynamic import to avoid loading Twilio if not configured
    const twilio = (await import("twilio")).default;

    const client = twilio(
      SMS_CONFIG.TWILIO_ACCOUNT_SID,
      SMS_CONFIG.TWILIO_AUTH_TOKEN
    );

    const result = await client.messages.create({
      body: message,
      from: SMS_CONFIG.TWILIO_PHONE_NUMBER,
      to: to,
    });

    console.log(`✅ SMS sent via Twilio: ${result.sid}`);
    return {
      success: true,
      provider: "twilio",
      messageId: result.sid,
      status: result.status,
    };
  } catch (error) {
    console.error("Twilio SMS error:", error);
    throw error;
  }
}

/**
 * Send SMS using Bulk SMS provider (Bangladesh)
 * @param {string} to - Phone number
 * @param {string} message - SMS message
 * @returns {Promise<object>} SMS result
 */
async function sendViaBulkSMS(to, message) {
  try {
    // Remove country code if present for BD numbers
    const phoneNumber = to.replace(/^\+88/, "");

    const response = await fetch(SMS_CONFIG.BULK_SMS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: SMS_CONFIG.BULK_SMS_API_KEY,
        senderid: SMS_CONFIG.BULK_SMS_SENDER_ID,
        number: phoneNumber,
        message: message,
      }),
    });

    const data = await response.json();

    if (data.success || data.status === "success") {
      console.log(`✅ SMS sent via Bulk SMS: ${phoneNumber}`);
      return {
        success: true,
        provider: "bulksms",
        messageId: data.message_id || data.id,
        status: data.status,
      };
    } else {
      throw new Error(data.message || "SMS sending failed");
    }
  } catch (error) {
    console.error("Bulk SMS error:", error);
    throw error;
  }
}

/**
 * Send SMS notification (automatically chooses provider)
 * @param {string} to - Phone number
 * @param {string} message - SMS message
 * @param {object} options - Additional options
 * @returns {Promise<object>} SMS result
 */
export async function sendSMS(to, message, options = {}) {
  try {
    // Validate phone number
    if (!to || to.length < 10) {
      throw new Error("Invalid phone number");
    }

    // Validate message
    if (!message || message.trim().length === 0) {
      throw new Error("Message cannot be empty");
    }

    // Truncate message if too long (SMS limit: 160 chars)
    const truncatedMessage =
      message.length > 160 ? message.substring(0, 157) + "..." : message;

    // Choose provider based on configuration
    let result;

    if (SMS_CONFIG.TWILIO_ACCOUNT_SID && SMS_CONFIG.TWILIO_AUTH_TOKEN) {
      // Use Twilio if configured
      result = await sendViaTwilio(to, truncatedMessage);
    } else if (SMS_CONFIG.BULK_SMS_API_KEY) {
      // Use Bulk SMS if configured
      result = await sendViaBulkSMS(to, truncatedMessage);
    } else {
      // No SMS provider configured - log only
      console.warn("⚠️ No SMS provider configured. Message not sent:");
      console.warn(`To: ${to}`);
      console.warn(`Message: ${truncatedMessage}`);

      return {
        success: false,
        provider: "none",
        message: "No SMS provider configured",
        simulatedMessage: truncatedMessage,
      };
    }

    return result;
  } catch (error) {
    console.error("SMS sending error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send emergency SOS SMS
 * @param {object} params - SOS parameters
 * @param {string} params.recipientPhone - Recipient phone number
 * @param {string} params.mechanicName - Mechanic name
 * @param {object} params.location - Location coordinates {lat, lng}
 * @param {string} params.bookingNumber - Booking number
 * @returns {Promise<object>} SMS result
 */
export async function sendSOSSMS({
  recipientPhone,
  mechanicName,
  location,
  bookingNumber,
}) {
  const message = `🚨 EMERGENCY SOS ALERT!
Mechanic: ${mechanicName}
Booking: ${bookingNumber}
Location: ${location.lat}, ${location.lng}
Please respond immediately!`;

  return sendSMS(recipientPhone, message);
}

/**
 * Send OTP SMS
 * @param {string} phone - Phone number
 * @param {string} otp - OTP code
 * @param {string} purpose - Purpose (e.g., "service start", "service completion")
 * @returns {Promise<object>} SMS result
 */
export async function sendOTPSMS(phone, otp, purpose = "verification") {
  const message = `Your OTP for ${purpose}: ${otp}. Valid for 10 minutes. Do not share this code.`;
  return sendSMS(phone, message);
}

/**
 * Send booking confirmation SMS
 * @param {string} phone - Phone number
 * @param {string} bookingNumber - Booking number
 * @param {string} garageName - Garage name
 * @param {Date} scheduledAt - Scheduled time
 * @returns {Promise<object>} SMS result
 */
export async function sendBookingConfirmationSMS(
  phone,
  bookingNumber,
  garageName,
  scheduledAt
) {
  const dateStr = new Date(scheduledAt).toLocaleString("en-BD", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const message = `Booking confirmed! #${bookingNumber}
Garage: ${garageName}
Time: ${dateStr}
Track: ${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard/bookings`;

  return sendSMS(phone, message);
}
