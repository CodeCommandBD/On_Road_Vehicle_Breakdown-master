/**
 * Refund Processing Utility
 * Handles automated refunds for cancelled bookings and disputes
 */

import Payment from "@/lib/db/models/Payment";
import User from "@/lib/db/models/User";
import Booking from "@/lib/db/models/Booking";
import { logAction, AUDIT_ACTIONS, SEVERITY } from "./auditLog";

/**
 * Refund policy configuration
 */
export const REFUND_POLICY = {
  // Cancellation refund percentages based on time before service
  CANCELLATION_REFUND: {
    HOURS_24_PLUS: 100, // 100% refund if cancelled 24+ hours before
    HOURS_12_TO_24: 75, // 75% refund if cancelled 12-24 hours before
    HOURS_6_TO_12: 50, // 50% refund if cancelled 6-12 hours before
    HOURS_0_TO_6: 25, // 25% refund if cancelled less than 6 hours before
    AFTER_START: 0, // No refund if service already started
  },

  // Dispute refund options
  DISPUTE_REFUND: {
    FULL: 100, // Full refund
    PARTIAL: 50, // Partial refund (50%)
    NONE: 0, // No refund
  },

  // Processing fees (non-refundable)
  PROCESSING_FEE_PERCENTAGE: 2, // 2% processing fee
};

/**
 * Calculate refund amount based on cancellation time
 * @param {number} paidAmount - Amount paid
 * @param {Date} scheduledAt - Scheduled service time
 * @param {Date} cancelledAt - Cancellation time
 * @returns {object} Refund calculation
 */
export function calculateCancellationRefund(
  paidAmount,
  scheduledAt,
  cancelledAt = new Date()
) {
  const hoursUntilService =
    (new Date(scheduledAt) - new Date(cancelledAt)) / (1000 * 60 * 60);

  let refundPercentage = 0;

  if (hoursUntilService >= 24) {
    refundPercentage = REFUND_POLICY.CANCELLATION_REFUND.HOURS_24_PLUS;
  } else if (hoursUntilService >= 12) {
    refundPercentage = REFUND_POLICY.CANCELLATION_REFUND.HOURS_12_TO_24;
  } else if (hoursUntilService >= 6) {
    refundPercentage = REFUND_POLICY.CANCELLATION_REFUND.HOURS_6_TO_12;
  } else if (hoursUntilService > 0) {
    refundPercentage = REFUND_POLICY.CANCELLATION_REFUND.HOURS_0_TO_6;
  } else {
    refundPercentage = REFUND_POLICY.CANCELLATION_REFUND.AFTER_START;
  }

  const refundAmount = (paidAmount * refundPercentage) / 100;
  const processingFee =
    (paidAmount * REFUND_POLICY.PROCESSING_FEE_PERCENTAGE) / 100;
  const finalRefund = Math.max(0, refundAmount - processingFee);

  return {
    paidAmount,
    refundPercentage,
    refundAmount,
    processingFee,
    finalRefund: Math.round(finalRefund * 100) / 100,
    hoursUntilService: Math.round(hoursUntilService * 10) / 10,
  };
}

/**
 * Process refund to user wallet
 * @param {object} params - Refund parameters
 * @param {string} params.userId - User ID
 * @param {string} params.bookingId - Booking ID
 * @param {string} params.paymentId - Payment ID
 * @param {number} params.refundAmount - Amount to refund
 * @param {string} params.reason - Refund reason
 * @param {string} params.processedBy - Admin/System user ID
 * @returns {Promise<object>} Refund result
 */
export async function processRefundToWallet({
  userId,
  bookingId,
  paymentId,
  refundAmount,
  reason,
  processedBy = null,
}) {
  try {
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Find payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Validate refund amount
    if (refundAmount > payment.amount) {
      throw new Error("Refund amount cannot exceed payment amount");
    }

    if (payment.status === "refunded") {
      throw new Error("Payment already refunded");
    }

    // Add to user wallet
    user.walletBalance = (user.walletBalance || 0) + refundAmount;
    await user.save();

    // Update payment status
    payment.status = "refunded";
    payment.refund = {
      amount: refundAmount,
      reason,
      processedAt: new Date(),
      transactionId: `REFUND-${Date.now()}`,
    };
    await payment.save();

    // Create refund payment record
    const refundPayment = await Payment.create({
      userId,
      bookingId,
      type: "refund",
      amount: refundAmount,
      currency: "BDT",
      status: "success",
      paymentMethod: "wallet",
      transactionId: `REFUND-${Date.now()}`,
      paidAt: new Date(),
      metadata: {
        description: `Refund for booking: ${reason}`,
        originalPaymentId: paymentId,
      },
    });

    // Log audit trail
    await logAction({
      action: AUDIT_ACTIONS.PAYMENT_REFUNDED,
      performedBy: processedBy,
      targetModel: "Payment",
      targetId: paymentId,
      changes: {
        refundAmount,
        reason,
        walletBalance: {
          before: user.walletBalance - refundAmount,
          after: user.walletBalance,
        },
      },
      severity: SEVERITY.HIGH,
    });

    console.log(
      `✅ Refund processed: ${refundAmount} BDT to user ${userId} wallet`
    );

    return {
      success: true,
      refundAmount,
      newWalletBalance: user.walletBalance,
      refundPayment,
    };
  } catch (error) {
    console.error("Refund processing error:", error);
    throw error;
  }
}

/**
 * Automated refund for cancelled booking
 * @param {string} bookingId - Booking ID
 * @param {string} cancelledBy - User ID who cancelled
 * @returns {Promise<object>} Refund result
 */
export async function processAutomatedRefund(bookingId, cancelledBy) {
  try {
    // Find booking
    const booking = await Booking.findById(bookingId).populate("user");
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Find payment for this booking
    const payment = await Payment.findOne({
      bookingId,
      status: "success",
    });

    if (!payment) {
      console.log("No successful payment found for booking, skipping refund");
      return {
        success: true,
        message: "No payment to refund",
      };
    }

    // Calculate refund amount
    const refundCalc = calculateCancellationRefund(
      payment.amount,
      booking.scheduledAt || new Date(),
      booking.cancelledAt || new Date()
    );

    if (refundCalc.finalRefund <= 0) {
      console.log("No refund applicable based on cancellation policy");
      return {
        success: true,
        message: "No refund applicable",
        refundCalculation: refundCalc,
      };
    }

    // Process refund
    const refundResult = await processRefundToWallet({
      userId: booking.user._id,
      bookingId: booking._id,
      paymentId: payment._id,
      refundAmount: refundCalc.finalRefund,
      reason: `Cancelled ${refundCalc.hoursUntilService}h before service (${refundCalc.refundPercentage}% refund)`,
      processedBy: cancelledBy,
    });

    return {
      success: true,
      ...refundResult,
      refundCalculation: refundCalc,
    };
  } catch (error) {
    console.error("Automated refund error:", error);
    throw error;
  }
}
