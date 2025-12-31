/**
 * Dynamic Pricing Engine
 * Calculates service costs based on multiple factors:
 * - Base service price
 * - Distance from garage to customer
 * - Time of day (night/emergency charges)
 * - Day of week (weekend/holiday charges)
 * - Vehicle type multiplier
 */

/**
 * Pricing configuration
 */
export const PRICING_CONFIG = {
  // Distance-based pricing (per km)
  DISTANCE_RATE_PER_KM: 15, // BDT per km
  FREE_DISTANCE_KM: 5, // First 5km free

  // Time-based multipliers
  NIGHT_CHARGE_MULTIPLIER: 1.5, // 50% extra for 10PM - 6AM
  NIGHT_START_HOUR: 22, // 10 PM
  NIGHT_END_HOUR: 6, // 6 AM

  // Weekend/Holiday charges
  WEEKEND_MULTIPLIER: 1.2, // 20% extra on weekends
  HOLIDAY_MULTIPLIER: 1.3, // 30% extra on holidays

  // Emergency/Urgent service
  EMERGENCY_CHARGE: 200, // Flat BDT 200 for emergency
  URGENT_MULTIPLIER: 1.3, // 30% extra for urgent bookings

  // Vehicle type multipliers
  VEHICLE_MULTIPLIERS: {
    motorcycle: 1.0,
    cng: 1.1,
    car: 1.2,
    rickshaw: 0.8,
    bus: 1.8,
    truck: 2.0,
    other: 1.0,
  },

  // Towing charges
  TOWING_BASE_CHARGE: 500, // Base towing charge
  TOWING_PER_KM: 30, // Per km towing charge

  // Tax and fees
  VAT_PERCENTAGE: 5, // 5% VAT
  SERVICE_FEE_PERCENTAGE: 3, // 3% platform fee
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Check if current time is night time
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
export function isNightTime(date = new Date()) {
  const hour = date.getHours();
  return (
    hour >= PRICING_CONFIG.NIGHT_START_HOUR ||
    hour < PRICING_CONFIG.NIGHT_END_HOUR
  );
}

/**
 * Check if date is weekend
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
export function isWeekend(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Calculate dynamic price for a booking
 * @param {object} params - Pricing parameters
 * @param {number} params.basePrice - Base service price
 * @param {number} params.distance - Distance in km
 * @param {string} params.vehicleType - Type of vehicle
 * @param {boolean} params.isEmergency - Is emergency booking
 * @param {boolean} params.isUrgent - Is urgent booking
 * @param {boolean} params.towingRequested - Is towing requested
 * @param {Date} params.scheduledAt - Scheduled time (default: now)
 * @returns {object} Price breakdown
 */
export function calculateDynamicPrice({
  basePrice = 0,
  distance = 0,
  vehicleType = "car",
  isEmergency = false,
  isUrgent = false,
  towingRequested = false,
  scheduledAt = new Date(),
}) {
  let breakdown = {
    basePrice,
    distanceCharge: 0,
    nightCharge: 0,
    weekendCharge: 0,
    emergencyCharge: 0,
    urgentCharge: 0,
    towingCharge: 0,
    vehicleMultiplier: 1.0,
    subtotal: 0,
    vat: 0,
    serviceFee: 0,
    total: 0,
  };

  // 1. Distance charge
  if (distance > PRICING_CONFIG.FREE_DISTANCE_KM) {
    const chargeableDistance = distance - PRICING_CONFIG.FREE_DISTANCE_KM;
    breakdown.distanceCharge =
      chargeableDistance * PRICING_CONFIG.DISTANCE_RATE_PER_KM;
  }

  // 2. Vehicle type multiplier
  breakdown.vehicleMultiplier =
    PRICING_CONFIG.VEHICLE_MULTIPLIERS[vehicleType] || 1.0;

  // 3. Calculate subtotal before time-based charges
  let subtotal = basePrice + breakdown.distanceCharge;
  subtotal = subtotal * breakdown.vehicleMultiplier;

  // 4. Night charge (percentage of subtotal)
  if (isNightTime(scheduledAt)) {
    breakdown.nightCharge =
      subtotal * (PRICING_CONFIG.NIGHT_CHARGE_MULTIPLIER - 1);
  }

  // 5. Weekend charge (percentage of subtotal)
  if (isWeekend(scheduledAt)) {
    breakdown.weekendCharge =
      subtotal * (PRICING_CONFIG.WEEKEND_MULTIPLIER - 1);
  }

  // 6. Emergency charge (flat fee)
  if (isEmergency) {
    breakdown.emergencyCharge = PRICING_CONFIG.EMERGENCY_CHARGE;
  }

  // 7. Urgent charge (percentage of subtotal)
  if (isUrgent) {
    breakdown.urgentCharge = subtotal * (PRICING_CONFIG.URGENT_MULTIPLIER - 1);
  }

  // 8. Towing charge
  if (towingRequested) {
    breakdown.towingCharge =
      PRICING_CONFIG.TOWING_BASE_CHARGE +
      distance * PRICING_CONFIG.TOWING_PER_KM;
  }

  // Calculate subtotal
  breakdown.subtotal =
    subtotal +
    breakdown.nightCharge +
    breakdown.weekendCharge +
    breakdown.emergencyCharge +
    breakdown.urgentCharge +
    breakdown.towingCharge;

  // 9. VAT
  breakdown.vat = (breakdown.subtotal * PRICING_CONFIG.VAT_PERCENTAGE) / 100;

  // 10. Service fee
  breakdown.serviceFee =
    (breakdown.subtotal * PRICING_CONFIG.SERVICE_FEE_PERCENTAGE) / 100;

  // Final total
  breakdown.total = Math.round(
    breakdown.subtotal + breakdown.vat + breakdown.serviceFee
  );

  // Round all values to 2 decimal places
  Object.keys(breakdown).forEach((key) => {
    if (typeof breakdown[key] === "number") {
      breakdown[key] = Math.round(breakdown[key] * 100) / 100;
    }
  });

  return breakdown;
}

/**
 * Get price estimate for display
 * @param {object} params - Same as calculateDynamicPrice
 * @returns {object} Simplified price estimate
 */
export function getPriceEstimate(params) {
  const breakdown = calculateDynamicPrice(params);

  return {
    estimatedTotal: breakdown.total,
    breakdown: {
      basePrice: breakdown.basePrice,
      distanceCharge: breakdown.distanceCharge,
      additionalCharges:
        breakdown.nightCharge +
        breakdown.weekendCharge +
        breakdown.emergencyCharge +
        breakdown.urgentCharge,
      towingCharge: breakdown.towingCharge,
      taxesAndFees: breakdown.vat + breakdown.serviceFee,
    },
    distance: params.distance,
    isNightTime: isNightTime(params.scheduledAt),
    isWeekend: isWeekend(params.scheduledAt),
  };
}
