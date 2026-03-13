/**
 * Booking Date Guards
 *
 * Utility functions to enforce date-based rules on bookings:
 * 1. Trip cannot START before pickupDate + pickupTime
 * 2. Trip cannot COMPLETE before dropDate/endDate + dropTime
 * 3. Booking auto-drops 24 hours after end date if not started
 */

/**
 * Combines a date and time string into a single Date object.
 * Handles various time formats (HH:mm, HH:mm:ss, h:mm AM/PM).
 */
export function combineDateAndTime(date: Date | string, time?: string | null): Date {
  const d = new Date(date);
  if (!time) return d;

  // Try parsing "HH:mm" or "HH:mm:ss"
  const match24 = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    d.setHours(parseInt(match24[1], 10), parseInt(match24[2], 10), match24[3] ? parseInt(match24[3], 10) : 0, 0);
    return d;
  }

  // Try parsing "h:mm AM/PM"
  const match12 = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  // Fallback: just return the date as-is
  return d;
}

/**
 * Checks if a trip can be started (OTP generation / trip start).
 * Returns { allowed: true } or { allowed: false, message: string }
 */
export function canStartTrip(pickupDate: Date | string, pickupTime?: string | null): { allowed: boolean; message?: string } {
  const startDateTime = combineDateAndTime(pickupDate, pickupTime);
  const now = new Date();

  if (now < startDateTime) {
    const formatted = startDateTime.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return {
      allowed: false,
      message: `Trip cannot be started before the booking start date/time (${formatted}). Please wait until the scheduled pickup time.`,
    };
  }

  return { allowed: true };
}

/**
 * Checks if a trip can be completed.
 * Returns { allowed: true } or { allowed: false, message: string }
 */
export function canCompleteTrip(endDate: Date | string, endTime?: string | null): { allowed: boolean; message?: string } {
  const endDateTime = combineDateAndTime(endDate, endTime);
  const now = new Date();

  if (now < endDateTime) {
    const formatted = endDateTime.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return {
      allowed: false,
      message: `Trip cannot be completed before the booking end date/time (${formatted}). Please wait until the scheduled drop-off time.`,
    };
  }

  return { allowed: true };
}

/**
 * Checks if a booking should be auto-dropped.
 * Drop condition: current time > endDate + 24 hours
 */
export function shouldAutoDrop(endDate: Date | string, endTime?: string | null): boolean {
  const endDateTime = combineDateAndTime(endDate, endTime);
  const dropDeadline = new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000); // +24 hours
  return new Date() > dropDeadline;
}

/**
 * Statuses that are eligible for auto-drop (pre-trip statuses).
 * If a booking is IN_PROGRESS or COMPLETED, it should NOT be dropped.
 */
export const DROPPABLE_STATUSES = {
  bike: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'READY_FOR_PICKUP'],
  car: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'READY_FOR_PICKUP'],
  bus: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED'],
  chauffeur: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'DRIVER_ASSIGNED'],
  luxury: ['PENDING_PAYMENT', 'ADVANCE_PAID', 'CONFIRMED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'PAYMENT_SUBMITTED', 'DRIVER_ASSIGNED'],
  equipment: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED'],
  truck: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED'],
  packers: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED', 'TEAM_ASSIGNED'],
} as const;

/**
 * Generate drop reason message for customer notification
 */
export function getDropReasonForCustomer(quotesReceived: number): string {
  if (quotesReceived === 0) {
    return 'Your booking has been automatically dropped by the system as no vendors responded with quotes before the booking end date.';
  }
  return 'Your booking has been automatically dropped by the system as quotes were received but no booking was confirmed before the end date.';
}

/**
 * Generate drop reason stored in DB
 */
export function getDropReasonForDB(quotesReceived: number): string {
  if (quotesReceived === 0) {
    return 'AUTO_DROP: No vendor quotes received. Booking end date + 24hrs passed.';
  }
  return 'AUTO_DROP: Quotes received but not confirmed by customer. Booking end date + 24hrs passed.';
}
