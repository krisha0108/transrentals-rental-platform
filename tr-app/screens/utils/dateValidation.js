// Shared date validation utilities for booking screens
// Minimum advance booking: pickup must be at least 12 hours from now

const MIN_ADVANCE_HOURS = 12;

/**
 * Get the minimum allowed booking date (12 hours from now, date only)
 */
export const getMinBookingDate = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Today's start — allow today's date in picker
  return now; // Time validation is handled by isPickupTooSoon() after time selection
};

/**
 * Check if a pickup datetime is too soon (less than 12 hours from now)
 * @param {Date} dateTime - The selected pickup date+time
 * @returns {boolean} true if too soon
 */
export const isPickupTooSoon = (dateTime) => {
  const now = new Date();
  const diffMs = dateTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours < MIN_ADVANCE_HOURS;
};

/**
 * Get a formatted string for the earliest allowed pickup time
 * @returns {string} e.g., "24 Mar 2026, 02:30 PM"
 */
export const getEarliestPickupLabel = () => {
  const now = new Date();
  const earliest = new Date(now.getTime() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
  const date = earliest.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = earliest.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
};

export { MIN_ADVANCE_HOURS };
