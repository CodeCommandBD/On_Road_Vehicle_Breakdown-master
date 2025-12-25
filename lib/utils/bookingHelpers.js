/**
 * Validate booking status transitions to enforce strict workflow.
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean|string} Returns true if valid, or an error message string if invalid.
 */
export const validateStatusTransition = (currentStatus, newStatus) => {
  // If status isn't changing, it's valid
  if (currentStatus === newStatus) return true;

  const allowedTransitions = {
    pending: ["confirmed", "cancelled"], // Can accept or reject/cancel
    confirmed: ["in_progress", "cancelled"], // Must start work or cancel
    in_progress: ["completed", "cancelled"], // Can finish or abort
    completed: ["disputed"], // Generally final, but can be disputed
    cancelled: [], // Terminal state
    disputed: ["resolved", "dismissed"], // Admin resolution
  };

  const allowed = allowedTransitions[currentStatus] || [];

  if (allowed.includes(newStatus)) {
    return true;
  }

  return `Invalid status transition from '${currentStatus}' to '${newStatus}'.`;
};
