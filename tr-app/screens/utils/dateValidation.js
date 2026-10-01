// Shared date validation utilities for booking screens
// Minimum advance booking: pickup must be at least 12 hours from now, which
// gives the driver time to reach the pickup point.

const MIN_ADVANCE_HOURS = 12;
const SLOT_MINUTES = 15;

/**
 * Earliest pickup the customer may choose: now + MIN_ADVANCE_HOURS, rounded
 * up to the next 15-minute slot so the picker shows a clean time.
 * @returns {Date}
 */
export const getEarliestPickup = () => {
  const earliest = new Date(Date.now() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
  earliest.setSeconds(0, 0);
  const remainder = earliest.getMinutes() % SLOT_MINUTES;
  if (remainder !== 0) {
    earliest.setMinutes(earliest.getMinutes() + (SLOT_MINUTES - remainder));
  }
  return earliest;
};

/**
 * Get the minimum allowed booking date for the date picker. This is the day
 * of the earliest allowed pickup, so today is only offered while a valid
 * pickup time is still left today.
 */
export const getMinBookingDate = () => {
  const day = getEarliestPickup();
  day.setHours(0, 0, 0, 0);
  return day;
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
 * Move a pickup that is too soon forward to the earliest allowed pickup.
 * @param {Date} dateTime
 * @returns {Date} the same moment if it is valid, otherwise the earliest one
 */
export const clampPickup = (dateTime) => {
  const earliest = getEarliestPickup();
  return dateTime.getTime() < earliest.getTime() ? earliest : dateTime;
};

/**
 * Format a Date's clock time as "HH:mm", the shape screens keep in state.
 * @param {Date} date
 * @returns {string}
 */
export const toTimeString = (date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/**
 * Format a Date as "YYYY-MM-DD" in the phone's local time zone.
 * `toISOString()` uses UTC, which sends a 00:00-05:29 IST pickup as the
 * previous day.
 * @param {Date} date
 * @returns {string}
 */
export const toLocalDateString = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * Combine a date and an "HH:mm" string into one Date.
 * @param {Date} date
 * @param {string} time
 * @returns {Date}
 */
export const combineDateAndTime = (date, time) => {
  const [hours, minutes] = String(time || '00:00').split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours || 0, minutes || 0, 0, 0);
  return combined;
};

/**
 * Get a formatted string for the earliest allowed pickup time
 * @returns {string} e.g., "24 Mar 2026, 02:30 PM"
 */
export const getEarliestPickupLabel = () => {
  const earliest = getEarliestPickup();
  const date = earliest.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = earliest.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
};

export { MIN_ADVANCE_HOURS };
